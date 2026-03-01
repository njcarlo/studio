
const admin = require('firebase-admin');

// Using service account if possible, or just default
// Since I don't have a service account file, I hope the environment handles it.
// IF not, I'll try to use the CLI to create a key.

if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: 'studio-3072837227-9a1db'
    });
}

const db = admin.firestore();
const auth = admin.auth();

async function run() {
    console.log('Seeding roles...');
    const roles = {
        admin: { name: 'Admin', permissions: ['manage_all', 'approve_requests', 'view_reports'] },
        approver: { name: 'Approver', permissions: ['approve_requests', 'view_reports'] },
        editor: { name: 'Editor', permissions: ['edit_data', 'view_reports'] },
        viewer: { name: 'Viewer', permissions: ['view_reports'] }
    };

    for (const [id, data] of Object.entries(roles)) {
        await db.collection('roles').doc(id).set(data);
    }

    console.log('Creating admin user...');
    let user;
    try {
        user = await auth.getUserByEmail('admin@system.com');
        console.log('Updating existing admin user...');
        await auth.updateUser(user.uid, {
            password: 'password'
        });
    } catch (e) {
        user = await auth.createUser({
            email: 'admin@system.com',
            password: 'password',
            displayName: 'System Admin'
        });
    }

    console.log('Creating worker profile for admin...');
    await db.collection('workers').doc(user.uid).set({
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@system.com',
        roleId: 'admin',
        status: 'Active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        workerId: '000001'
    });

    console.log('Done.');
}

run().catch(console.error);
