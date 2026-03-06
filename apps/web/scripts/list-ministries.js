
const admin = require('firebase-admin');
if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: 'studio-3072837227-9a1db' });
}
const db = admin.firestore();
async function list() {
    const snap = await db.collection('ministries').get();
    console.log(`Ministries: ${snap.size}`);
    snap.forEach(doc => {
        console.log(`ID: ${doc.id}, Name: ${doc.data().name}`);
    });
}
list().catch(console.error);
