
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde el backend
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usar Service Role para editar sin auth

if (!supabaseUrl || !supabaseKey) {
    console.error("Faltan credenciales de Supabase en .env del backend");
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
        name: 'Demo Usuario',
        display_name: 'Tu Perfil Link',
        subtitle: 'Perfil Verificado ✅',
        photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop',
        instagram: 'https://instagram.com/onlyprogram',
        tiktok: 'https://tiktok.com/@onlyprogram',
        telegram: 'https://t.me/onlyprogram',
        onlyfans: 'https://onlyfans.com',
        buttons: [
            {
                id: 'btn1',
                label: 'Mi Canal Privado',
                url: 'https://t.me/privado',
                type: 'telegram',
                style: 'primary'
            },
            {
                id: 'btn2',
                label: 'Instagram Exclusivo',
                url: 'https://instagram.com',
                type: 'instagram',
                style: 'secondary'
            }
        ],
        // Asegurar que config tenga algo por si acaso
        config: { theme: 'dark' }
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
