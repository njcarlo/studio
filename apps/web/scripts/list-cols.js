
const admin = require('firebase-admin');
if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: 'studio-3072837227-9a1db' });
}
const db = admin.firestore();
async function list() {
    const cols = await db.listCollections();
    for (const col of cols) {
        console.log(`Collection: ${col.id}`);
        const snap = await col.limit(5).get();
        console.log(` - Count (up to 5): ${snap.size}`);
    }
}
list().catch(console.error);
