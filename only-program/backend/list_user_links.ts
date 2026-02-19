
import { supabase } from './src/services/supabase.service';

async function listLinks() {
    console.log("🔍 Listing links for user...");
    // Use the known user ID from previous steps
    const userId = '92b92c46-e0c2-4115-888e-a3c7d0fc6aeb';

    const { data: links, error } = await supabase
        .from('smart_links')
        .select('id, slug, title, custom_domain, created_at, config')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("❌ Error fetching links:", error);
    } else {
        console.table(links);
    }
}

listLinks();
