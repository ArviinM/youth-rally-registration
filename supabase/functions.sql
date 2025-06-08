--------------------------------------------------
-- Helper Function: Get Age Bracket
--------------------------------------------------
-- Drops the function if it exists to allow re-creation
DROP FUNCTION IF EXISTS public.get_age_bracket(integer);

-- Defines the function to determine age bracket based on age
CREATE OR REPLACE FUNCTION public.get_age_bracket(registrant_age INT)
RETURNS TEXT AS $$
BEGIN
    -- Determine bracket based on the revised ranges
    IF registrant_age BETWEEN 12 AND 17 THEN RETURN '12-17';
    ELSIF registrant_age BETWEEN 18 AND 25 THEN RETURN '18-25';
    ELSIF registrant_age BETWEEN 26 AND 40 THEN RETURN '26-40';
    ELSIF registrant_age >= 41 THEN RETURN '41+';
    ELSE RETURN 'Unknown'; -- Handle cases outside defined brackets (e.g., < 12)
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE; -- IMMUTABLE as output only depends on input

COMMENT ON FUNCTION public.get_age_bracket(integer) IS 'Determines the age bracket string based on the registrant age using defined ranges (12-17, 18-25, 26-40, 41+).';


--------------------------------------------------
-- Main Function: Assign Group to Registrant
--------------------------------------------------
-- Drops the function if it exists to allow re-creation
DROP FUNCTION IF EXISTS public.assign_group_to_registrant(bigint);

-- Function to assign a group based on balancing logic
CREATE OR REPLACE FUNCTION public.assign_group_to_registrant(registrant_id_to_assign BIGINT)
RETURNS void AS $$
DECLARE
    -- Variables for the new registrant's profile
    reg_age INT;
    reg_location TEXT;
    reg_gender TEXT;
    reg_age_bracket TEXT;

    -- Variables for tracking the best target group
    target_group_id INT := 1;
    best_score RECORD;

    -- Variables for loop and current group evaluation
    current_group_id INT;
    current_score RECORD;

BEGIN
    -- 1. Get the new registrant's details
    SELECT age, church_location::TEXT, gender
    INTO reg_age, reg_location, reg_gender
    FROM public.registrants
    WHERE id = registrant_id_to_assign;

    -- Exit if registrant not found
    IF NOT FOUND THEN
        RAISE WARNING '[GROUP_ASSIGN] Registrant ID % not found.', registrant_id_to_assign;
        RETURN;
    END IF;

    -- Exit if registrant is below the minimum age
    IF reg_age < 12 THEN
        RAISE WARNING '[GROUP_ASSIGN] Registrant ID % age % is below 12. No group assigned.', registrant_id_to_assign, reg_age;
        RETURN;
    END IF;

    -- Determine the registrant's age bracket
    reg_age_bracket := get_age_bracket(reg_age);

    -- Initialize best_score to NULL
    best_score := NULL;

    -- 2. Evaluate groups 1 through 5
    FOR current_group_id IN 1..5 LOOP
        -- Calculate counts for the current group being evaluated
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE get_age_bracket(age) = reg_age_bracket) AS bracket,
            COUNT(*) FILTER (WHERE church_location::TEXT = reg_location) AS location,
            COUNT(*) FILTER (WHERE gender = reg_gender) AS gender
        INTO current_score -- Assign structure here
        FROM public.registrants
        WHERE assigned_group = current_group_id;

        -- Decision Logic: Handle first iteration separately
        IF best_score IS NULL THEN
             -- First group evaluated, it's automatically the best so far
            best_score := current_score;
            target_group_id := current_group_id;
        ELSE
            -- Compare current group score with the best score found so far
            IF current_score.total < best_score.total
               OR (current_score.total = best_score.total AND current_score.bracket < best_score.bracket)
               OR (current_score.total = best_score.total AND current_score.bracket = best_score.bracket AND current_score.location < best_score.location)
               OR (current_score.total = best_score.total AND current_score.bracket = best_score.bracket AND current_score.location = best_score.location AND current_score.gender < best_score.gender)
            THEN
                -- This group is better based on the criteria, update best score and target group
                best_score := current_score;
                target_group_id := current_group_id;
            END IF;
            -- Tie-breaking by group ID is implicitly handled by only updating if strictly better
        END IF;

    END LOOP;

    -- 3. Assign the determined group
    UPDATE public.registrants
    SET assigned_group = target_group_id
    WHERE id = registrant_id_to_assign;

    RAISE LOG '[GROUP_ASSIGN] Assigned Registrant ID: %, Age: %, Location: %, Gender: %, Bracket: % --> Group: %',
        registrant_id_to_assign, reg_age, reg_location, reg_gender, reg_age_bracket, target_group_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Use SECURITY DEFINER to ensure function runs with definer's permissions, bypassing caller's potentially restrictive RLS for counting/updating.

COMMENT ON FUNCTION public.assign_group_to_registrant(bigint) IS 'Assigns a registrant to a group (1-5) based on balancing total count, age bracket, location, and gender counts across groups.';

-- Grant execute permission to the authenticated role (or anon if needed)
-- Adjust 'authenticated' role if you use a different role for logged-in users/admins calling RPC
GRANT EXECUTE ON FUNCTION public.assign_group_to_registrant(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_age_bracket(integer) TO authenticated;
-- If called via trigger, these grants might not be necessary, but are needed for RPC. 