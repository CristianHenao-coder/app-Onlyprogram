
import { supabase } from './src/services/supabase.service';

async function createLink() {
    console.log("🛠️ Creating Dummy Link 'page1'...");

    // Check if exists first
    const { data: existing } = await supabase.from('smart_links').select('id').eq('slug', 'page1').single();

    if (existing) {
        console.log("✅ Link 'page1' already exists with ID:", existing.id);
        return;
    }

    // Insert dummy link
    // We need a valid user_id. Let's try to get one, or null if allowed (unlikely).
    // Actually, for this strict test, let's just insert with a random UUID for user_id if constraint allows, 
    // or better, find a user first.

    // Use specific user ID found via debug_db.ts
    const userId = '92b92c46-e0c2-4115-888e-a3c7d0fc6aeb';

    // Set expires_at to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data, error } = await supabase.from('smart_links').insert({
        slug: 'page1',
        title: 'Test Page',
        user_id: userId,
        config: { theme: { backgroundType: 'solid', backgroundStart: '#000000' } },
        expires_at: expiresAt.toISOString() // REQUIRED FIELD
    }).select().single();

    if (error) {
        console.error("❌ Error creating link:", error);
    } else {
        console.log("✅ Created Link:", data);
    }
}

createLink();
