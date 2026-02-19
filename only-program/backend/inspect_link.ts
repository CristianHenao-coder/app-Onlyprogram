
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) { process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const { data: links, error } = await supabase
        .from('smart_links')
        .select('*')
        .eq('custom_domain', 'simulado.com')
        .limit(1);

    if (error) {
        console.error(error);
        return;
    }
    if (links && links[0]) {
        console.log("Columnas disponibles:", Object.keys(links[0]));
        console.log("Datos actuales:", links[0]);
    } else {
        console.log("No link found");
    }
}

inspect();
