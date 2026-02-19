
import { supabase } from './src/services/supabase.service';

async function checkDomain() {
    console.log("🔍 Checking 'pruebafinal.com' in database...");

    const { data, error } = await supabase
        .from('smart_links')
        .select('slug, custom_domain')
        .eq('custom_domain', 'pruebafinal.com');

    if (error) {
        console.error("❌ DB Error:", error);
    } else {
        console.log("✅ Results:", data);
        if (data.length === 0) {
            console.log("⚠️ No link found for this domain! Did the user click 'Buy'?");
        }
    }
}

checkDomain();
