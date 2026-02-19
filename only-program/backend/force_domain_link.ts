
import { supabase } from './src/services/supabase.service';

async function forceSetDomain() {
    const DOMAIN = 'pruebafinal.com';
    const TARGET_SLUG = 'page1771395484694';

    console.log(`🛠️ Force linking '${DOMAIN}' to '${TARGET_SLUG}'...`);

    // 1. Clear domain from ANY other link to exist constraint error
    const { error: clearError } = await supabase
        .from('smart_links')
        .update({ custom_domain: null })
        .eq('custom_domain', DOMAIN);

    if (clearError) {
        console.error("⚠️ Error clearing existing domain usage:", clearError);
    } else {
        console.log("Deleted existing domain usage.");
    }

    // 2. Get target link ID (Verified UUID from debug_link_content)
    const TARGET_ID = '3414510b-2cd5-4d7a-ba6f-3efb25b2fc3f';
    console.log(`Using Target ID: ${TARGET_ID}`);

    /*
    const { data: link } = await supabase.from('smart_links').select('id').eq('slug', TARGET_SLUG).single();

    if (!link) {
        console.error(`❌ '${TARGET_SLUG}' link not found.`);
        return;
    }
    */
    const link = { id: TARGET_ID };

    // 3. Update
    const { data, error } = await supabase
        .from('smart_links')
        .update({
            custom_domain: DOMAIN,
            status: 'active',
            is_active: true
        })
        .eq('id', link.id)
        .select();

    if (error) {
        console.error("❌ DB Update Error:", error);
    } else {
        console.log("✅ SUCCESS! Linked:", data);
    }
}

forceSetDomain();
