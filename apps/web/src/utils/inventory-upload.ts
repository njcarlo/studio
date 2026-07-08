import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseStorage } from '@/lib/firebase-client';

export async function uploadItemPhoto(file: File, itemId = 'general'): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `items/${itemId}/${Date.now()}.${ext}`;

    const storageRef = ref(firebaseStorage, path);

    try {
        await uploadBytes(storageRef, file);
    } catch (error: any) {
        throw new Error(`Upload failed: ${error.message}`);
    }

    return getDownloadURL(storageRef);
}
