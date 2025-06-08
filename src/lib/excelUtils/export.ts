import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import type { Database } from '../supabase/database.types'; // Adjust path as needed

type RegistrantRow = Database['public']['Tables']['registrants']['Row'];

/**
 * Generates an Excel file with participant data (All, Groups, Unassigned) and triggers download.
 * @param registrants Array of registrant data (age 12+).
 */
export const exportParticipantsData = async (registrants: RegistrantRow[]): Promise<void> => {
  if (!registrants || registrants.length === 0) {
    toast.warning("No participant data available to export.");
    return;
  }

  toast.info("Generating export file...");

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Camp Registration System';
    workbook.created = new Date();
    workbook.modified = new Date();

    const headers = [
      { header: 'Full Name', key: 'full_name', width: 30 },
      { header: 'Age', key: 'age', width: 10 },
      { header: 'Gender', key: 'gender', width: 15 },
      { header: 'Location', key: 'church_location', width: 25 },
      { header: 'Assigned Group', key: 'assigned_group', width: 15 },
    ];

    // --- All Participants Sheet ---
    const allSheet = workbook.addWorksheet('All Participants');
    allSheet.columns = headers;
    allSheet.mergeCells('A1:E1');
    const titleCellAll = allSheet.getCell('A1');
    titleCellAll.value = 'Laguna District Family Camp - All Participants (Age 12+)';
    titleCellAll.font = { name: 'Calibri', size: 16, bold: true };
    titleCellAll.alignment = { vertical: 'middle', horizontal: 'center' };
    allSheet.addRow([]); // Spacer row
    const headerRowAll = allSheet.addRow(headers.map((h) => h.header));
    headerRowAll.font = { bold: true };
    registrants.forEach((reg) => {
      allSheet.addRow({
        ...reg,
        assigned_group: reg.assigned_group ?? 'None',
      });
    });

    // --- Group Sheets ---
    const groups = [1, 2, 3, 4, 5]; // Or derive from data if needed
    groups.forEach((groupNum) => {
      const groupRegistrants = registrants.filter((reg) => reg.assigned_group === groupNum);
      if (groupRegistrants.length === 0) return; // Skip empty groups

      const sheetName = `Group ${groupNum}`;
      const sheet = workbook.addWorksheet(sheetName);
      const groupHeaders = headers.filter((h) => h.key !== 'assigned_group');

      sheet.columns = groupHeaders;
      sheet.mergeCells('A1:D1');
      const titleCellGroup = sheet.getCell('A1');
      titleCellGroup.value = `Laguna District Family Camp - ${sheetName} Participants`;
      titleCellGroup.font = { name: 'Calibri', size: 16, bold: true };
      titleCellGroup.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.addRow([]); // Spacer row
      const headerRowGroup = sheet.addRow(groupHeaders.map((h) => h.header));
      headerRowGroup.font = { bold: true };
      groupRegistrants.forEach((reg) => {
        // Create a new object excluding the assigned_group property
        const { assigned_group, ...regDataForGroupSheet } = reg;
        sheet.addRow(regDataForGroupSheet);
      });
    });

    // --- Unassigned Sheet ---
    const unassignedRegistrants = registrants.filter((reg) => reg.assigned_group === null);
    if (unassignedRegistrants.length > 0) {
      const unassignedSheet = workbook.addWorksheet('Unassigned');
      const unassignedHeaders = headers.filter((h) => h.key !== 'assigned_group');

      unassignedSheet.columns = unassignedHeaders;
      unassignedSheet.mergeCells('A1:D1');
      const titleCellUnassigned = unassignedSheet.getCell('A1');
      titleCellUnassigned.value = 'Laguna District Family Camp - Unassigned Participants (Age 12+)';
      titleCellUnassigned.font = { name: 'Calibri', size: 16, bold: true };
      titleCellUnassigned.alignment = { vertical: 'middle', horizontal: 'center' };
      unassignedSheet.addRow([]); // Spacer row
      const headerRowUnassigned = unassignedSheet.addRow(unassignedHeaders.map((h) => h.header));
      headerRowUnassigned.font = { bold: true };
      unassignedRegistrants.forEach((reg) => {
          const { assigned_group, ...regDataForUnassignedSheet } = reg;
          unassignedSheet.addRow(regDataForUnassignedSheet);
      });
    }

    // --- Save File ---
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const date = new Date().toISOString().split('T')[0];
    saveAs(blob, `family-camp-export-${date}.xlsx`);
    toast.success("Export file generated successfully!");

  } catch (exportError) {
    console.error("Export Error:", exportError);
    toast.error("An error occurred during export. Please check the console.");
    // Re-throw or handle as needed if the caller needs to know about the error
    // throw exportError;
  }
};
