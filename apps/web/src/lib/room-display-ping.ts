import { FieldValue } from 'firebase-admin/firestore';
import { firebaseAdminFirestore } from '@/lib/firebase-admin';

// Replaces the Postgres `ping_room_display()` trigger (migration plan §7).
// Booking data is still Postgres-resident (Phase 3 hasn't migrated it), so
// there's no `bookings/{id}` Firestore doc to hang a Cloud Function trigger
// off of yet — every call site that mutates a Booking row calls this
// directly instead. Content-free by design: just a timestamp the kiosk
// listener (`rooms/display/page.tsx`) uses to know when to refetch.
export async function pingRoomDisplay(roomId: string): Promise<void> {
    try {
        await firebaseAdminFirestore
            .collection('roomDisplayPings')
            .doc(roomId)
            .set({ updatedAt: FieldValue.serverTimestamp() });
    } catch (err) {
        console.error('[pingRoomDisplay] failed:', err);
    }
}
