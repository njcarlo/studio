
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const projectId = 'studio-3072837227-9a1db';

// We rely on Application Default Credentials (ADC) or the local CLI authentication
if (getApps().length === 0) {
    initializeApp({
        projectId: projectId,
    });
}

const db = getFirestore();
const auth = getAuth();

async function seed() {
    console.log('Starting seed process...');

    try {
        // 1. Create Roles
        console.log('Creating roles...');
        const roles = [
            {
                id: 'admin',
                name: 'Admin',
                description: 'Full system access',
                permissions: ['manage_all', 'approve_requests', 'view_reports']
            },
            {
                id: 'approver',
                name: 'Approver',
                description: 'Can approve requests',
                permissions: ['approve_requests', 'view_reports']
            },
            {
                id: 'editor',
                name: 'Editor',
                description: 'Can edit data',
                permissions: ['edit_data', 'view_reports']
            },
            {
                id: 'viewer',
                name: 'Viewer',
                description: 'Read-only access',
                permissions: ['view_reports']
            }
        ];

        for (const role of roles) {
            await db.collection('roles').doc(role.id).set(role);
        }

        // 2. Create Admin User
        console.log('Creating admin user...');
        let user;
        try {
            user = await auth.getUserByEmail('admin@system.com');
            console.log('Admin user already exists, updating password...');
            await auth.updateUser(user.uid, {
                password: 'password'
            });
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                user = await auth.createUser({
                    email: 'admin@system.com',
                    password: 'password',
                    displayName: 'System Admin'
                });
            } else {
                throw error;
            }
        }

        // 3. Create Worker Profile for Admin
        console.log('Creating worker profile for admin...');
        await db.collection('workers').doc(user.uid).set({
            firstName: 'System',
            lastName: 'Admin',
            email: 'admin@system.com',
            roleId: 'admin',
            status: 'Active',
            createdAt: FieldValue.serverTimestamp(),
            workerId: '000001',
            primaryMinistryId: 'admin-ministry' // Placeholder
        });

        // 4. Create Departments
        console.log('Creating departments...');
        const departments = ['Worship', 'Outreach', 'Relationship', 'Discipleship', 'Administration'];
        for (const name of departments) {
            await db.collection('departments').doc(name).set({
                id: name,
                name: name,
                mealStubTotalAllocation: 100 // Default allocation
            });
        }

        // 5. Create Ministries
        console.log('Creating ministries...');
        const ministries = [
            { id: 'music-ministry', name: 'Music Ministry', department: 'Worship' },
            { id: 'tech-team', name: 'Tech Team', department: 'Worship' },
            { id: 'ushering', name: 'Userhing', department: 'Worship' },
            { id: 'missions', name: 'Missions', department: 'Outreach' },
            { id: 'hospitality', name: 'Hospitality', department: 'Relationship' },
            { id: 'youth-ministry', name: 'Youth Ministry', department: 'Discipleship' },
            { id: 'admin-ministry', name: 'Finance', department: 'Administration' }
        ];

        for (const m of ministries) {
            await db.collection('ministries').doc(m.id).set({
                ...m,
                mealStubTotalLimit: 20
            });
        }

        console.log('Seed process completed successfully!');
    } catch (error) {
        console.error('Error during seed process:', error);
        process.exit(1);
    }
}

seed();
