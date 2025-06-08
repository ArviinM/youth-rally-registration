'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../src/lib/supabase/client'; // Corrected relative path
import type { Database } from '../../../src/lib/supabase/database.types'; // Corrected relative path
import { ParticipantTable } from '@/components/participant-table'; // Import reusable component
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // For action buttons
import { Download, Upload, Users, FileSpreadsheet, AlertTriangle } from 'lucide-react'; // Icons for buttons and FileSpreadsheet, added AlertTriangle
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input"; // Import Input for file selection
import { Label } from "@/components/ui/label"; // Import Label
import { toast } from "sonner"; // For feedback
import { downloadImportTemplate } from '../../../src/lib/excelUtils/template'; // Use alias path if configured
import { processRegistrantImport, ImportResult } from '../../../src/lib/excelUtils/import'; // Use alias path if configured
import { exportParticipantsData } from '../../../src/lib/excelUtils/export'; // Import the export function
import { useAuth } from '../../../src/context/AuthContext'; // Import useAuth
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added Alert imports

// Define the type for a registrant row we expect to fetch
type RegistrantRow = Database['public']['Tables']['registrants']['Row'];

export default function ManageParticipantsPage() {
  const [registrants, setRegistrants] = useState<RegistrantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false); // State for export button
  const [isImportModalOpen, setIsImportModalOpen] = useState(false); // State for modal
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // State for selected file
  const [isProcessingImport, setIsProcessingImport] = useState(false); // State for import processing
  const [importResult, setImportResult] = useState<ImportResult | null>(null); // State for import results
  const [isAssigningGroups, setIsAssigningGroups] = useState(false); // State for manual group assignment

  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input
  const { user, isAdmin, loading: authLoading } = useAuth(); // Get auth state and isAdmin flag

  // Define fetchRegistrants within component scope
  const fetchRegistrants = async () => {
      setLoading(true);
      setError(null);
      try {
        // Task 6.2: Fetch all *eligible* registrants (age >= 12)
        const { data, error: fetchError } = await supabase
          .from('registrants')
          .select('*')
          .gte('age', 12) // Filter for age 12 and up
          .order('created_at', { ascending: false }); // Order by creation time

        if (fetchError) {
        // Handle RLS errors potentially more gracefully
        if (fetchError.code === '42501') { // permission denied
          console.error("RLS Error: Permission denied fetching registrants.", fetchError);
          setError("You don't have permission to view participant data.");
        } else {
          throw fetchError;
        }
        }

        setRegistrants(data || []);
      } catch (err: any) {
        console.error("Error fetching registrants:", err);
      // Avoid setting generic error if RLS error was already set
      if (!error) {
        setError(err.message || "Failed to fetch registrants.");
      }
        setRegistrants([]);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    // Only fetch if user is loaded and authenticated (session check might be redundant with middleware)
    if (!authLoading && user) {
    fetchRegistrants();
    }
    // If auth is done loading and there's no user, clear data/stop loading
    if (!authLoading && !user) {
      setLoading(false);
      setRegistrants([]);
      setError("Please log in to view participants.");
    }
  }, [user, authLoading]); // Depend on user and authLoading state

  const handleManualGroupTrigger = async () => {
    if (!isAdmin) {
      toast.error("Only admins can trigger group assignments.");
      return;
    }
    
    setIsAssigningGroups(true);
    toast.info("Attempting to assign groups to all eligible, unassigned participants...");

    try {
      const { data, error } = await supabase.rpc('assign_all_ungrouped_registrants');

      if (error) {
        console.error('Supabase manual group assignment error:', error);
        throw new Error(`Failed to trigger group assignment: ${error.message}`);
      }

      console.log(`Manual assignment attempted for ${data} participants.`);
      toast.success(`Group assignment process finished. Attempted to assign ${data ?? 0} participants. Refreshing list...`);

      // Refresh the participant list to show updated group assignments
      await fetchRegistrants();

    } catch (err: any) {
      console.error("Error during manual group assignment:", err);
      toast.error(err.message || "An unexpected error occurred during group assignment.");
    } finally {
      setIsAssigningGroups(false);
    }
  };

  const handleExport = async () => {
    if (!isAdmin) {
      toast.error("Only admins can export data.");
      return;
    }
    setIsExporting(true);
    try {
      await exportParticipantsData(registrants);
    } catch (err) {
      // Error handling is now mostly within the utility function,
      // but you could add more specific component-level handling here if needed.
      console.error("Caught export error in component:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Use the imported function for downloading the template
  const handleDownloadTemplate = async () => {
    await downloadImportTemplate();
  };

  // Function to handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImportResult(null); // Clear previous results when new file selected
    if (file) {
      // Basic validation (e.g., check file type)
      if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        toast.error("Invalid file type. Please upload an Excel (.xlsx) file.");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
        return;
      }
      setSelectedFile(file);
      toast.info(`File "${file.name}" selected.`);
    } else {
      setSelectedFile(null);
    }
  };

  // Function to trigger the import process using the utility function
  const handleProcessImport = async () => {
    if (!isAdmin) {
      toast.error("Only admins can import data.");
      return;
    }
    if (!selectedFile) {
      toast.warning("Please select a file to upload.");
      return;
    }
    setIsProcessingImport(true);
    setImportResult(null); // Clear previous results

    const result = await processRegistrantImport(selectedFile);
    setImportResult(result); // Store the result

    setIsProcessingImport(false);

    // If import was successful and inserted/updated rows, refresh the participant list
    if (result.success && result.insertedCount > 0) {
      toast.info("Refreshing participant list...");
      await fetchRegistrants(); // Re-fetch data
      // Optionally close modal on success?
      // setIsImportModalOpen(false);
    }
  };

  // Reset file state when modal is closed
  useEffect(() => {
    if (!isImportModalOpen) {
      setSelectedFile(null);
      setImportResult(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [isImportModalOpen]);

  // Show loading state while auth is resolving
  if (authLoading) {
    return <div className="py-6 text-center">Loading user data...</div>;
  }

  return (
    <div className="py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
           <div>
            <CardTitle className="text-2xl font-bold">Manage Participants</CardTitle>
            <CardDescription>View, export, and import eligible camp registrants (Age 12+).</CardDescription>
           </div>
          {/* Conditionally render buttons based on admin role */}
          {isAdmin && (
           <div className="flex flex-wrap gap-2">
              {/* Import Button with Dialog */}
              <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" /> Import
                </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Import Participants from Excel</DialogTitle>
                    <DialogDescription>
                      Download the template, fill it out, and upload the completed file.
                      Ensure data starts on row 2.
                      Import all necessary files first, then click the main 'Assign Groups' button.
                    </DialogDescription>
                  </DialogHeader>
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Important Import Rules</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Age must be 12 or older.</li>
                        <li>Gender must be Male or Female.</li>
                        <li>Location must match the dropdown list in the template.</li>
                        <li>Only registrants meeting these criteria will be imported.</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                  <div className="grid gap-4 py-4 -mt-2">
                    {/* Download Template Button */}
                    <Button variant="secondary" onClick={handleDownloadTemplate}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Template (.xlsx)
                    </Button>
                    {/* File Input */}
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="excel-file">Upload Completed File</Label>
                      <Input
                        id="excel-file"
                        type="file"
                        accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={handleFileChange}
                        ref={fileInputRef} // Assign ref
                        disabled={isProcessingImport}
                      />
                      {selectedFile && !importResult && (
                        <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>
                      )}
                    </div>
                    {/* Display Import Results */}
                    {importResult && (
                      <div className="mt-4 space-y-2 rounded-md border p-4">
                        <p className={`text-sm font-semibold ${importResult.success ? 'text-green-600' : 'text-red-600'}`}> 
                          {importResult.success ? 'Import Successful' : 'Import Finished with Issues'}
                        </p>
                        <p className="text-xs text-muted-foreground">{importResult.message}</p>
                        {importResult.errors && importResult.errors.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-destructive">Errors ({importResult.errors.length}):</p>
                            <ul className="list-disc pl-4 max-h-20 overflow-y-auto">
                              {importResult.errors.slice(0, 5).map((err: string, index: number) => (
                                <li key={index} className="text-xs text-destructive">{err}</li>
                              ))}
                              {importResult.errors.length > 5 && <li className="text-xs text-destructive italic">... (more errors in console)</li>}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      onClick={handleProcessImport}
                      disabled={!selectedFile || isProcessingImport}
                    >
                      {isProcessingImport ? (
                        <>
                          <FileSpreadsheet className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload & Process File
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Export Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting || loading || registrants.length === 0} // Disable if no data
              >
                {isExporting ? (
                  <FileSpreadsheet className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {isExporting ? 'Exporting...' : 'Export'}
                </Button>
              {/* Assign Groups Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleManualGroupTrigger}
                  disabled={isAssigningGroups || loading || authLoading}
                >
                  {isAssigningGroups ? (
                    <Users className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Users className="mr-2 h-4 w-4" />
                  )}
                  {isAssigningGroups ? 'Assigning...' : 'Assign Groups'}
                </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* TODO: Add filtering/tabs for groups (Task 6.3) */}
          
          {(loading || authLoading) && <p>Loading registrants...</p>}
          {error && <p className="text-red-600">Error: {error}</p>}
          {!loading && !authLoading && !error && (
            <ParticipantTable
              registrants={registrants}
              caption="A list of all registered participants (Age 12+)."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
} 