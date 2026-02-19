
import { supabase } from './src/services/supabase.service';

async function listUsers() {
    console.log("🔍 Listing Auth Users (Admin)...");
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("❌ Error fetching users:", error);
    } else {
        if (data.users.length > 0) {
            console.log("✅ Found User ID:", data.users[0].id);
        } else {
            console.log("⚠️ No users found in auth.users.");
        }
    }
}

listUsers();
