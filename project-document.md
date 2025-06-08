# Project Document: Family Camp Registration System

**1. Introduction**

This document outlines the plan for developing a web-based registration system for the upcoming Family Camp scheduled for May 1-2. The primary goal is to facilitate registration and automatically distribute participants into five balanced groups based on age and church location.

**2. Project Goal & Objectives**

* **Goal:** To create an efficient online registration system that fairly distributes participants into 5 distinct groups for the Family Camp.
* **Objectives:**
    * Develop a user-friendly registration form.
    * Implement an automated grouping algorithm to ensure balanced distribution considering age brackets and church location.
    * Enable administrators to import existing member data from Excel files.
    * Allow administrators to export registration lists and final group assignments to Excel files.
    * Provide a simple interface for administrators to view and manage registrations.
    * Deploy the system for use before the registration deadline.

**3. Scope**

* **In Scope:**
    * Frontend development (Registration form, Admin dashboard view).
    * Backend development (Database schema, API endpoints for registration, grouping logic, data import/export).
    * Database setup and management (Supabase).
    * Implementation of the grouping algorithm.
    * Excel data import/export functionality.
    * Basic user authentication for administrators (optional, depending on time).
* **Out of Scope:**
    * Payment processing.
    * Real-time communication features (chat, notifications).
    * Complex reporting or analytics beyond basic exports.
    * Public-facing group pages (participants will likely be informed of their group separately).

**4. Features**

* **Participant Registration:**
    * Fields: Full Name, Age (or Date of Birth), Gender (optional), Church Location (Dropdown list), Contact Number (optional), Email (optional).
    * Submission confirmation message.
* **Automated Grouping:**
    * Algorithm to assign registrants to one of 5 groups upon registration or via a batch process.
    * Logic aims to balance groups based on:
        * **Age Brackets:** (e.g., Child, Teen, Young Adult, Adult, Senior - specific brackets TBD).
        * **Church Location:** Ensuring representation from various locations in each group where possible.
* **Data Import (Admin):**
    * Upload an Excel file (`.xlsx`) with pre-existing member data.
    * Map Excel columns to database fields.
    * Batch registration and grouping of imported data (with automatic trigger for group assignment).
* **Data Export (Admin):**
    * Export master registration list to Excel.
    * Export individual group lists to Excel.
* **Admin Dashboard (Basic):**
    * View list of all registrants.
    * View participants assigned to each of the 5 groups.
    * Manually trigger the grouping process for all eligible, unassigned participants.
    * Access Import/Export functions.

**5. Technology Stack**

* **Frontend:** Next.js (React Framework)
* **UI Components:** Shadcn/ui
* **Backend & Database:** Supabase (PostgreSQL, Auth, Storage, Functions)
* **Excel Handling:** ExcelJS (or similar library compatible with Next.js/Node.js environment)
* **Deployment:** Vercel (Recommended for Next.js & Supabase integration)

**6. Church Locations**

* Alaminos
* Bae
* Bagong Kalsada
* Biñan
* Cabuyao
* Calamba
* Calauan
* Canlubang
* Carmona
* GMA
* Macabling
* Makiling
* Pagsanjan
* Pila
* Romblon
* San Pablo
* Silang
* Sta. Rosa
* Victoria

**7. High-Level Timeline & Considerations**

* **Target Completion:** Before May 1 (Ideally a few days prior for testing).
* **Constraint:** The timeline (less than a week) is very tight. Prioritization is crucial. Focus on MVP (Minimum Viable Product): Registration Form, Basic Grouping Logic, Data Export. Import and Admin Dashboard refinements can be secondary if time is limited.
* **Grouping Complexity:** The balancing act between age and location needs a clear, potentially simplified, algorithm for this timeframe. Perfect balance might be difficult; aim for "reasonably balanced".

**8. Potential Risks**

* **Time Constraint:** Development and testing time is extremely limited.
* **Grouping Algorithm:** Developing and testing a fair and effective algorithm quickly.
* **Data Import Complexity:** Handling variations in Excel file formats or data quality.
