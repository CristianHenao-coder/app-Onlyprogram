
import { supabase } from './src/services/supabase.service';

async function setCustomDomain() {
    console.log("🛠️ Setting custom domain for 'page1'...");

    // Check if link exists
    const { data: link } = await supabase.from('smart_links').select('id').eq('slug', 'page1').single();

    if (!link) {
        console.error("❌ Link 'page1' not found!");
        return;
    }

    const { data, error } = await supabase
        .from('smart_links')
        .update({ custom_domain: 'misitio.com' })
        .eq('id', link.id)
        .select();

    if (error) {
        console.error("❌ Error updating link:", error);
    } else {
        console.log("✅ Custom Domain Set:", data);
    }
}

setCustomDomain();
