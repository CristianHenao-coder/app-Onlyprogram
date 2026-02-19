
import { supabase } from './src/services/supabase.service';

async function debugLink() {
    const SLUG = 'page1771395484694';
    console.log(`🔍 Inspecting link: ${SLUG}`);

    const { data, error } = await supabase
        .from('smart_links')
        .select('*')
        .eq('slug', '3414510b-2cd5-4d7a-ba6f-3efb25b2fc3f');

    if (error) {
        console.error("❌ Error:", error);
    } else {
        console.log("✅ DATA found (First 5):");
        console.log(JSON.stringify(data, null, 2));
    }
}

debugLink();
