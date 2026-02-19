
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function testNullUpdate() {
    const TARGET_ID = '3414510b-2cd5-4d7a-ba6f-3efb25b2fc3f';
    console.log(`Testing NULL update for ID: ${TARGET_ID}`);

    const { data, error } = await supabase
        .from('smart_links')
        .update({ custom_domain: null })
        .eq('id', TARGET_ID)
        .select();

    if (error) {
        console.error('Update Error:', error);
    } else {
        console.log('Update Success:', data);
    }
}

testNullUpdate();
