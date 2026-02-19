
import { supabase } from './src/services/supabase.service';

async function listAllLinks() {
    console.log("🔍 Listing ALL links in system...");
    const { data: links, error } = await supabase
        .from('smart_links')
        .select('id, slug, title, user_id, custom_domain')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("❌ Error:", error);
    } else {
        console.table(links);
    }
}

listAllLinks();
