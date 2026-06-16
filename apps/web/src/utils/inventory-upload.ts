import { supabaseBrowser } from '@/lib/supabase-browser';

export async function uploadItemPhoto(file: File, itemId = 'general'): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `items/${itemId}/${Date.now()}.${ext}`;

    const { error } = await supabaseBrowser.storage
        .from('inventory-photos')
        .upload(path, file, { upsert: true });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data } = supabaseBrowser.storage.from('inventory-photos').getPublicUrl(path);
    return data.publicUrl;
}
