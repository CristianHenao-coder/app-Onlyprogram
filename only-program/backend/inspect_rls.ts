
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function inspectRLS() {
    console.log('Inspecting RLS for smart_links...');
    const { data: policies, error } = await supabase.rpc('get_policies', { table_name: 'smart_links' });

    // If rpc fails (common if not defined), try a direct query to pg_policies
    if (error) {
        console.log('RPC failed, trying direct query...');
        const { data, error: pgError } = await supabase.from('pg_policies').select('*').eq('tablename', 'smart_links');
        if (pgError) {
            // Second fallback: check if we can successfully perform a targeted UPDATE with anon key vs service role
            console.error('Could not fetch policies:', pgError.message);
        } else {
            console.log('Policies:', data);
        }
    } else {
        console.log('Policies:', policies);
    }
}

inspectRLS();
