
import { supabase } from './src/services/supabase.service';

async function updateTheme() {
    console.log("🎨 Updating 'page1' theme to look like a PRO...");

    const { data: link } = await supabase.from('smart_links').select('id').eq('slug', 'page1').single();

    if (!link) return console.error("❌ Link not found");

    const newConfig = {
        theme: {
            backgroundType: 'image',
            backgroundImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop', // Abstract dark elegant
            buttonStyle: 'rounded-xl',
            buttonColor: 'rgba(255, 255, 255, 0.1)',
            buttonTextColor: '#ffffff',
            fontFamily: 'Inter',
            textColor: '#ffffff'
        },
        profile: {
            displayName: 'Santiago VIP',
            bio: 'Exclusive Content & Daily Updates 📸',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200' // Stylish avatar
        }
    };

    // Add some buttons if empty
    const buttons = [
        { id: '1', label: '🔥 My Exclusive Content', url: 'https://onlyfans.com', icon: 'lock', animation: 'pulse' },
        { id: '2', label: '💬 Chat with Me', url: 'https://telegram.org', icon: 'message-circle' },
        { id: '3', label: '📸 Instagram', url: 'https://instagram.com', icon: 'instagram' }
    ];

    const { error } = await supabase
        .from('smart_links')
        .update({
            config: newConfig,
            buttons: buttons,
            title: 'Santiago VIP',
            photo: newConfig.profile.avatar
        })
        .eq('id', link.id);

    if (error) {
        console.error("❌ Error updating theme:", error);
    } else {
        console.log("✅ Theme Updated! Reload page to see the magic.");
    }
}

updateTheme();
