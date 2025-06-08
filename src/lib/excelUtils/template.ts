import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { CHURCH_LOCATIONS } from '../constants'; // Corrected relative path

/**
 * Generates and downloads an Excel template for importing registrants.
 * Includes data validation for the 'Location' column.
 */
export const downloadImportTemplate = async (): Promise<void> => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Registrants Template');

    // Define headers required for import
    const templateHeaders = [
      { header: 'Full Name', key: 'full_name', width: 30 },
      { header: 'Age', key: 'age', width: 10 },
      { header: 'Gender', key: 'gender', width: 15 }, // e.g., Male, Female
      { header: 'Location', key: 'church_location', width: 25 }, // Must match values in CHURCH_LOCATIONS
    ];
    sheet.columns = templateHeaders;
    sheet.getRow(1).font = { bold: true };

    // --- Add Data Validation for Location (Column D) ---
    // Create a comma-separated string of allowed locations for the formula
    // Excel list validation requires the list as a double-quoted comma-separated string
    const locationsList = `"${CHURCH_LOCATIONS.join(',')}"`;

    // Apply validation to the 'Location' column (index 4) starting from row 2
    // We apply it to a large range assuming many potential entries.
    // Note: Directly setting validation on the column object seems less reliable across Excel versions
    // than applying it to a range of cells.
    for (let i = 2; i <= 3; i++) { // Apply to first 1000 data rows
        const cell = sheet.getCell(`D${i}`);
        cell.dataValidation = {
            type: 'list',
            allowBlank: true, // Allow blank cells
            formulae: [locationsList],
            showErrorMessage: true,
            errorStyle: 'stop',
            errorTitle: 'Invalid Location',
            error: `Please select a location from the dropdown list. Allowed values are: ${CHURCH_LOCATIONS.join(', ')}.`,
        };
    }
    // Alternatively, apply to column (might be less compatible):
    // sheet.getColumn('D').dataValidation = { ... };

    // Add a note in the template below the headers
    // sheet.getRow(2).values = []; // Ensure row 2 is clear before merging/adding notes if needed
    // sheet.mergeCells('A3:D3');
    // const noteCell = sheet.getCell('A3');
    // noteCell.value =
    //   'Notes: Fill data starting from row 2. Age must be 12 or older. Gender should be Male or Female. Location must be selected from the dropdown list.';
    // noteCell.font = { italic: true, size: 9 };
    // noteCell.alignment = { wrapText: true, vertical: 'top' };
    // sheet.getRow(3).height = 30; // Increase row height for note visibility


    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, 'family-camp-import-template.xlsx');
    toast.success('Template downloaded successfully!');
  } catch (error) {
    console.error('Error generating template:', error);
    toast.error('Failed to download template.');
  }
};
