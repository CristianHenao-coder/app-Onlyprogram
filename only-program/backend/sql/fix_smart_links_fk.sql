-- Fix Relationship between smart_links and profiles
-- This is required for PostgREST to allow embedding profiles in smart_links queries

DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'smart_links_user_id_profiles_fkey'
    ) THEN
        -- Add the foreign key constraint pointing to public.profiles
        -- This allows: .select('*, profiles(*)')
        ALTER TABLE public.smart_links
        ADD CONSTRAINT smart_links_user_id_profiles_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(id)
        ON DELETE CASCADE;
    END IF;
END $$;
