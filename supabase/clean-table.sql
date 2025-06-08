-- Clean up script for registrants table

DELETE FROM public.registrants;

-- Optional: Reset the ID sequence if needed (uncomment the line below)
-- ALTER SEQUENCE public.registrants_id_seq RESTART WITH 1;

-- Optional: If you prefer TRUNCATE (faster, resets ID automatically, but requires higher privileges and can have issues with foreign keys if added later)
-- TRUNCATE TABLE public.registrants RESTART IDENTITY; 