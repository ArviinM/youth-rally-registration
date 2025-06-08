import ExcelJS from 'exceljs';
import { toast } from 'sonner';
import { supabase } from '../supabase/client'; // Correct path to Supabase client
import { CHURCH_LOCATIONS } from '../constants'; // Correct path to constants
import type { Database } from '../supabase/database.types'; // Correct path to types

// Type for the data we expect to insert/upsert (subset of RegistrantRow)
type RegistrantInsert = Database['public']['Tables']['registrants']['Insert'];

// Define a type for the result of the import process
export interface ImportResult {
  success: boolean;
  message: string;
  processedRows: number;
  insertedCount: number; // Or successful upsert count
  skippedCount: number;
  errors: string[];
}

// Define the expected headers exactly as generated in the template
const EXPECTED_HEADERS = ['Full Name', 'Age', 'Gender', 'Location'];
// Map headers to the keys used for data access
const HEADER_KEY_MAP = {
    'Full Name': 'full_name',
    'Age': 'age',
    'Gender': 'gender',
    'Location': 'church_location'
};

/**
 * Reads an Excel file, validates registrant data, and upserts valid entries to Supabase.
 * @param file The Excel file object to process.
 * @returns An ImportResult object summarizing the process.
 */
export const processRegistrantImport = async (file: File): Promise<ImportResult> => {
  const result: ImportResult = {
    success: false,
    message: 'Import process started.',
    processedRows: 0,
    insertedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  console.log("Processing file:", file.name);
  toast.info("Starting import process...");

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
        throw new Error("Could not find worksheet in the uploaded file.");
    }

    // --- Header Validation --- 
    const headerRow = worksheet.getRow(1);
    const actualHeaders = headerRow.values as string[]; // Read values from Row 1
    
    // Basic check: Ensure actualHeaders is an array and has expected length
    if (!Array.isArray(actualHeaders) || actualHeaders.length < EXPECTED_HEADERS.length) {
        throw new Error(
            `Invalid header row. Expected ${EXPECTED_HEADERS.length} columns: [${EXPECTED_HEADERS.join(', ')}]. Found fewer columns.`
        );
    }

    // Trim whitespace from actual headers and compare
    const trimmedActualHeaders = actualHeaders.slice(1, EXPECTED_HEADERS.length + 1).map(h => h?.trim()); // Slice(1) because exceljs values array can be 1-indexed with a null at 0

    let headersMatch = true;
    for (let i = 0; i < EXPECTED_HEADERS.length; i++) {
        if (trimmedActualHeaders[i] !== EXPECTED_HEADERS[i]) {
            headersMatch = false;
            break;
        }
    }

    if (!headersMatch) {
        throw new Error(
            `Header mismatch. Expected columns: [${EXPECTED_HEADERS.join(', ')}]. Found: [${trimmedActualHeaders.join(', ')}] in the first row. Please use the downloaded template.`
        );
    }
    // --- End Header Validation ---

    const validRegistrants: RegistrantInsert[] = [];
    let rowCount = 0;

    // Iterate over rows, starting from row 2 (data rows)
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        rowCount++;
        // Skip header row (already validated)
        if (rowNumber === 1) return;

        result.processedRows++;

        // --- Data Extraction (Using Column Indices: A=1, B=2, C=3, D=4) ---
        // This is potentially more robust if key mapping fails
        const fullName = row.getCell(1).value?.toString().trim() || ''; // Column A
        const ageValue = row.getCell(2).value; // Column B
        const gender = row.getCell(3).value?.toString().trim() || ''; // Column C
        const location = row.getCell(4).value?.toString().trim() || ''; // Column D

        // --- Validation ---
        let isValid = true;
        const rowErrors: string[] = [];

        if (!fullName) { isValid = false; rowErrors.push('Full Name is missing'); }

        let age: number | null = null;
        if (ageValue === null || ageValue === undefined || ageValue === '') {
            isValid = false; rowErrors.push('Age is missing');
        } else {
            age = Number(ageValue);
            if (isNaN(age) || !Number.isInteger(age)) { isValid = false; rowErrors.push(`Invalid age format: "${ageValue}"`);
            } else if (age < 12) { isValid = false; rowErrors.push(`Age must be 12 or older, found: ${age}`); }
        }

        const validGenders = ['Male', 'Female'];
        if (!gender) { isValid = false; rowErrors.push('Gender is missing');
        } else if (!validGenders.some(g => g.toLowerCase() === gender.toLowerCase())) { isValid = false; rowErrors.push(`Invalid gender: "${gender}". Must be Male or Female.`); }

        if (!location) { isValid = false; rowErrors.push('Location is missing');
        } else if (!CHURCH_LOCATIONS.includes(location as any)) { isValid = false; rowErrors.push(`Invalid location: "${location}". Must match allowed values.`); }

        // --- Collect Valid Data ---
        if (isValid && age !== null) {
            validRegistrants.push({
                full_name: fullName,
                age: age, 
                gender: validGenders.find(g => g.toLowerCase() === gender.toLowerCase()) || null, 
                church_location: location as any, 
            });
        } else {
            result.skippedCount++;
            result.errors.push(`Row ${rowNumber}: ${rowErrors.join(', ')}`);
        }
    });

    if (rowCount <= 1) { 
        throw new Error("No data rows found in the file.");
    }

    // --- 5. Call Supabase Upsert ---
    if (validRegistrants.length > 0) {
        toast.info(`Attempting to upsert ${validRegistrants.length} valid registrants...`);
        const { count, error: upsertError } = await supabase
            .from('registrants')
            .upsert(validRegistrants, {
                // onConflict: 'full_name', // Removed: Requires a UNIQUE constraint on full_name in DB
                // Adjust onConflict based on your actual unique constraints if any.
                // ignoreDuplicates: false, // Removed: Only relevant with onConflict
                count: 'exact' // Get the count of affected rows here
            });

        if (upsertError) {
            console.error("Supabase upsert error:", upsertError);
            throw new Error(`Database error during upsert: ${upsertError.message}`);
        }

        result.insertedCount = count ?? 0;
        result.success = true;
        result.message = `Import finished. Processed: ${result.processedRows}, Upserted/Updated: ${result.insertedCount}, Skipped: ${result.skippedCount}.`;

        // Update message to reflect manual step needed
        toast.info("Remember to manually assign groups using the 'Assign Groups' button after importing all files.");

    } else {
        // No valid registrants found, but processing might have occurred
        if (result.errors.length > 0) {
             result.message = `Import completed with validation errors. Processed: ${result.processedRows}, Skipped: ${result.skippedCount}. See errors for details.`;
        } else {
             result.message = "Import file processed, but no valid registrant data found to import.";
        }
        // Keep success as false if nothing was upserted
    }

  } catch (error: any) {
    console.error("Error during import processing:", error);
    result.success = false;
    result.message = `Import failed: ${error.message}`;
    result.errors.push(error.message);
    toast.error(`Import failed: ${error.message}`); // Also show toast error
  }

  // Provide detailed feedback
  if (result.success) {
      toast.success(result.message);
  } else {
      // Errors might already be in toast from the catch block
      if (result.skippedCount > 0) {
           toast.warning(`Skipped ${result.skippedCount} rows due to validation errors. Check console or error details if available.`);
      }
  }
  // Log detailed errors if any
  if (result.errors.length > 0) {
      console.warn("Import validation errors:", result.errors);
  }

  return result;
};
