# Grouping Algorithm Documentation

This document outlines the logic used to automatically assign registrants to one of five balanced groups for the Family Camp.

**Goal:** To distribute participants into 5 distinct groups, aiming for reasonable balance based on Age Bracket, Church Location, and Gender.

**Trigger:** The algorithm is intended to be run automatically immediately after a new registrant is successfully saved to the database.

## Balancing Factors & Priority

The algorithm considers the following factors in order of priority when deciding which group to assign a new registrant to:

1.  **Lowest Total Count:** Assign to the group currently having the fewest members overall.
2.  **Lowest Age Bracket Count (Tie-breaker 1):** If multiple groups are tied for the lowest total count, assign to the tied group that currently has the fewest members matching the *new registrant's specific age bracket*.
3.  **Lowest Location Count (Tie-breaker 2):** If multiple groups are still tied (lowest total count AND lowest count for the age bracket), assign to the tied group that currently has the fewest members matching the *new registrant's specific church location*.
4.  **Lowest Gender Count (Tie-breaker 3):** If multiple groups are still tied (lowest total, age bracket count, AND location count), assign to the tied group that currently has the fewest members matching the *new registrant's specific gender*.
5.  **Lowest Group ID (Final Tie-breaker):** In the unlikely event that multiple groups are still tied after considering all previous factors, assign the registrant to the tied group with the lowest numerical Group ID (e.g., Group 1 over Group 2).

## Defined Age Brackets

The algorithm uses the following age brackets (age is inclusive):

*   12-17
*   18-25
*   26-40
*   41+

## Implementation Details

*   **Recommended Method:** Supabase Database Function (PL/pgSQL).
    *   **Pros:** Performance (calculations stay within the database), Atomicity (can run in the same transaction), Centralized Logic.
    *   **Cons:** Requires SQL/PL/pgSQL knowledge.
*   **Alternative Method:** JavaScript function (e.g., in Next.js `/lib` or `/utils`).
    *   **Cons:** Slower (multiple network requests for fetching counts and updating), Less atomic (potential race conditions), Logic separated from data.

## Process Flow (Conceptual)

1.  A new registrant record is inserted into the `registrants` table.
2.  The grouping function/trigger receives the `id` of the new registrant.
3.  The function fetches the `age`, `church_location`, and `gender` of the new registrant.
4.  The registrant's `age_bracket` is determined based on their age.
5.  The function iterates through Group IDs 1 to 5.
6.  For each Group ID, it queries the `registrants` table to count:
    *   Total members in that group (`count_total`).
    *   Members matching the new registrant's age bracket (`count_age_bracket`).
    *   Members matching the new registrant's church location (`count_location`).
    *   Members matching the new registrant's gender (`count_gender`).
7.  Using the counts and the priority rules (detailed above), the function determines the `target_group_id`.
8.  The function updates the new registrant's record, setting `assigned_group = target_group_id`. 