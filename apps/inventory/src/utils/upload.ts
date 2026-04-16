/**
 * Photo upload using Supabase Storage (replaces Firebase Storage).
 * Bucket: "inventory-photos" — create this in your Supabase dashboard.
 */
import { supabase } from '../lib/supabase';

export async function uploadItemPhoto(file: File, itemId = 'general'): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `items/${itemId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
        .from('inventory-photos')
        .upload(path, file, { upsert: true });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data } = supabase.storage.from('inventory-photos').getPublicUrl(path);
    return data.publicUrl;
}
