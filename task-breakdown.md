# Task Breakdown: Family Camp Registration System (Direct Supabase)

This breakdown outlines the key tasks required to build the Family Camp Registration System using direct Supabase integration from Next.js.

**Phase 1: Setup & Foundation (Est. 0.5 days)**

* [ ] **Task 1.1:** Initialize Next.js Project.
* [ ] **Task 1.2:** Set up Supabase Project (Database, Auth - if needed).
* [ ] **Task 1.3:** Install and configure Shadcn/ui.
* [ ] **Task 1.4:** Install ExcelJS library (`npm install exceljs`).
* [ ] **Task 1.5:** Install Supabase client library (`npm install @supabase/supabase-js`).
* [ ] **Task 1.6:** Define Database Schema in Supabase (e.g., `registrants` table with columns: `id`, `created_at`, `full_name`, `age`, `church_location`, `assigned_group`, etc.). Set up Row Level Security (RLS) policies appropriately.
* [ ] **Task 1.7:** Configure Supabase client in Next.js (environment variables for URL and anon key).
* [ ] **Task 1.8:** Set up basic project structure (folders for components, app router with /dashboard group, utils, lib/supabase).

**Phase 2: Core Registration Feature (Est. 1 day)**

* [ ] **Task 2.1:** Create the Registration Page UI (`/dashboard/register`).
* [ ] **Task 2.2:** Build the Registration Form component using Shadcn/ui components (Input, Select for location, Button).
    * Include fields: Full Name, Age (Must be 12 or above), Church Location (populate dropdown from list).
    * Add form validation (required fields, age >= 12). Clearly state the age requirement (12+) on the form.
* [ ] **Task 2.3:** Implement the form submission logic (e.g., using an event handler in a Client Component).
* [ ] **Task 2.4:** Inside the submission logic, call `supabase.from('registrants').insert(...)` directly using the Supabase client library to save valid registration data (age >= 12) to the Supabase table. Handle potential errors. Ensure RLS policies are in place for inserts.
* [ ] **Task 2.5:** Display a success/confirmation message upon successful registration, or an error message if age is below 12 or if the database operation fails.

**Phase 3: Grouping Algorithm & Assignment (Est. 1-1.5 days)**

* [ ] **Task 3.1:** Define Age Brackets **starting from age 12** (e.g., 12-18, 19-30, 31-50, 51+). *Decision needed.*
* [ ] **Task 3.2:** Design the Grouping Algorithm Logic (operates only on registrants aged 12+).
    * *Option A (Simpler):* Round-robin assignment.
    * *Option B (Better Balance):* Calculate group "scores" based on current counts per age bracket/location.
    * *Decision needed.*
* [ ] **Task 3.3:** Implement the grouping algorithm.
    * **Recommended:** As a Supabase Database Function (PL/pgSQL). This keeps logic close to data and can be called securely via `supabase.rpc()`.
    * *Alternative:* As a JavaScript function within Next.js (e.g., in `/utils` or `/lib/supabase`). Requires fetching necessary data (like current group counts) from Supabase first.
* [ ] **Task 3.4:** Integrate Grouping Logic:
    * *Option A (Trigger from Client):* After successful registration insert (Task 2.4), call the Supabase Function (e.g., using `supabase.rpc('assign_group', { registrant_id: new_id })`) or the JS function to determine the group and update the registrant's record (`supabase.from('registrants').update(...)`). Ensure RLS allows updates if triggered directly. **(Note: Individual assignment on insert not currently implemented)**
    * *Option B (Manual Trigger):* Create an admin button that triggers a client-side function to run the grouping logic (calling the Supabase Function or JS implementation) on all *ungrouped, eligible* registrants. **(Implemented: Uses `supabase.rpc('assign_all_ungrouped_registrants')`)**
* [X] **Task 3.5:** Test the grouping logic with sample data.

**Phase 4: Data Export Feature (Est. 0.5 days)**

* [X] **Task 4.1:** Create a client-side function (e.g., in an admin component or utils) triggered by an admin button.
* [X] **Task 4.2:** Implement logic within the function to fetch all eligible registrants (age >= 12) directly from Supabase using the client library (`supabase.from('registrants').select('*').gte('age', 12)`). Ensure RLS allows admin reads.
* [X] **Task 4.3:** Use ExcelJS *client-side* to generate an Excel file buffer/blob from the fetched data.
* [X] **Task 4.4:** Trigger a file download in the browser using the generated blob and appropriate file naming.
* [X] **Task 4.5:** Add a button/link on the admin page/dashboard section to trigger the export function.
* [ ] **Task 4.6:** Implement separate exports per group (modify Supabase query to filter by `assigned_group`).

**Phase 5: Data Import Feature (Est. 1 day - *Lower Priority*)**

* [X] **Task 5.1:** Design the expected Excel file structure/template.
* [X] **Task 5.2:** Create an Admin Page/Section UI (`/dashboard/participants`) for file upload (e.g., using `<input type="file">` within a Dialog).
* [X] **Task 5.3:** Create a client-side function to handle the file selection and processing (`processRegistrantImport` utility).
* [X] **Task 5.4:** Implement logic within the client-side function/utility to:
    * Read the selected file using the browser's File API.
    * Parse the Excel file using ExcelJS (client-side).
    * Iterate through rows, validating data and **filtering out rows where age < 12.**
    * Prepare an array of valid registrant objects.
* [X] **Task 5.5:** Perform batch insert/upsert directly to Supabase using the client library (`supabase.from('registrants').upsert(validRegistrants)`). Handle potential errors and limits. Ensure RLS allows admin inserts/upserts.
* [ ] **Task 5.6:** ~~Trigger the grouping algorithm (`assign_all_ungrouped_registrants` RPC) for newly imported/upserted users from the client-side after successful import.~~ **(Removed - Group assignment is now manual via Task 6.5)**
* [X] **Task 5.7:** Provide feedback to the admin on import success/failure/rows processed/skipped directly in the UI.

**Phase 6: Admin View & Management (Est. 0.5-1 day - *Refined*)**

* [X] **Task 6.1:** Create Dashboard Structure & Sidebar (Update `components/dashboard-sidebar.tsx` with new routes: `/dashboard`, `/dashboard/register`, `/dashboard/participants`, `/dashboard/groups`). Implement `app/dashboard/layout.tsx`. (Partially done)
* [X] **Task 6.2:** Create Dashboard Overview Page (`/dashboard/page.tsx`).
    * Fetch basic counts (total registrants >= 12, count per group).
    * Display these counts (e.g., using Shadcn Cards).
* [X] **Task 6.3:** Create Manage Participants Page (`/dashboard/participants/page.tsx`).
    * Move existing registrant fetching logic (from old `/admin`) here.
    * Display the list of all *eligible* registrants (age >= 12) using Shadcn Table.
* [ ] **Task 6.4:** Create View Groups Page (`/dashboard/groups/page.tsx`).
    * Implement filtering/tabs/sections to view participants by assigned group (Groups 1-5, and maybe 'Unassigned').
    * Fetch data filtered by group (`.eq('assigned_group', selectedGroup)`) or fetch all and filter client-side.
* [X] **Task 6.5:** Add Admin Action Buttons (on relevant pages, e.g., `/dashboard/participants`).
    * Button to trigger Export (Phase 4).
    * Button to trigger Import (Phase 5).
    * Button to manually trigger group assignment for **all** ungrouped participants (using `assign_all_ungrouped_registrants` RPC). **(This is the primary assignment trigger)**
* [ ] **Task 6.6:** (Optional) Secure the `/dashboard` routes (e.g., using Supabase Auth + RLS, or simple password protection if time-constrained).

**Phase 7: Testing & Deployment (Est. 0.5 days)**

* [ ] **Task 7.1:** End-to-end testing: Registration (including age < 12 rejection), direct Supabase interactions, grouping, export, import (if applicable). Check RLS policies thoroughly.
* [ ] **Task 7.2:** Test responsiveness.
* [ ] **Task 7.3:** Deploy the application (e.g., to Vercel, ensuring Supabase environment variables are set correctly for the *client-side* bundle). (In Progress)
* [ ] **Task 7.4:** Final testing on the deployed environment.

**Notes:**

* Timeline remains aggressive. Prioritize MVP.
* Use the Supabase client library (`supabase-js`) directly from client-side code (components, utility functions) for all database interactions (reads and writes).
* **Supabase Row Level Security (RLS) is CRUCIAL** for securing your data, as interactions originate directly from the browser. Define policies carefully for inserts, updates, selects, and deletes on the `registrants` table.
* Decide early on the grouping algorithm implementation (Supabase Function vs. JS in the client/utils). Supabase Function is generally recommended for security and keeping logic close to data.
* Ensure client-side environment variables for Supabase (URL and Anon Key) are correctly exposed (e.g., prefixed with `NEXT_PUBLIC_`).
