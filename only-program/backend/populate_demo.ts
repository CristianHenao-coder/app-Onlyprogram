
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno (estamos en backend/)
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usar Service Role

if (!supabaseUrl || !supabaseKey) {
    console.error("Faltan credenciales de Supabase en .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateDemo() {
    console.log("Buscando link con dominio simulado.com...");

    const { data: links, error: fetchError } = await supabase
        .from('smart_links')
        .select('*')
        .eq('custom_domain', 'simulado.com')
        .limit(1);

    if (fetchError) {
        console.error("Error buscando link:", fetchError);
        return;
    }

    if (!links || links.length === 0) {
        console.error("No se encontró ningún link con el dominio simulado.com");
        return;
    }

    const link = links[0];
    console.log(`Encontrado link: ${link.slug} (ID: ${link.id})`);

    const updates = {
        title: 'Tu Perfil Link (Demo)', // Usamos title ya que display_name no existe
        subtitle: 'Perfil Verificado ✅',
        photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop',
        verified_badge: true,
        // instagram, tiktok, onlyfans NO existen en la tabla según inspect
        // Los metemos en config por si acaso el frontend evoluciona para leerlos de ahí
        config: {
            theme: 'dark',
            instagram: 'https://instagram.com/onlyprogram',
            tiktok: 'https://tiktok.com/@onlyprogram',
            onlyfans: 'https://onlyfans.com',
            telegram: 'https://t.me/onlyprogram'
        },
        buttons: [
            {
                id: 'btn1',
                label: '🔥 Mi Contenido Exclusivo',
                url: 'https://onlyfans.com',
                type: 'onlyfans', // El frontend lo detecta por type
                style: 'primary',
                active: true
            },
            {
                id: 'btn2',
                label: '💬 Unete a mi Telegram',
                url: 'https://t.me/onlyprogram',
                type: 'telegram',
                style: 'secondary',
                active: true
            },
            {
                id: 'btn3',
                label: '📸 Instagram',
                url: 'https://instagram.com',
                type: 'instagram',
                style: 'outline',
                active: true
            }
        ]
    };

    const { error: updateError } = await supabase
        .from('smart_links')
        .update(updates)
        .eq('id', link.id);

    if (updateError) {
        console.error("Error actualizando link:", updateError);
    } else {
        console.log("✅ Link actualizado con datos de prueba!");
    }
}

populateDemo();
