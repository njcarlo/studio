import { PrismaClient, Department } from '@prisma/client';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Initialize Firebase Admin
// Ensure you have FIREBASE_PROJECT_ID and potentially GOOGLE_APPLICATION_CREDENTIALS set
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'studio-3072837227-9a1db'
    });
}

const db = admin.firestore();

function toDate(ts: any): Date {
    if (!ts) return new Date();
    if (ts.toDate) return ts.toDate();
    if (ts._seconds) return new Date(ts._seconds * 1000);
    return new Date(ts);
}

function mapDepartment(dept: string): Department {
    const mapping: Record<string, Department> = {
        'Worship': Department.Worship,
        'Outreach': Department.Outreach,
        'Relationship': Department.Relationship,
        'Discipleship': Department.Discipleship,
        'Administration': Department.Administration
    };
    return mapping[dept] || Department.Administration;
}

async function migrateCollection(collectionName: string, prismaModel: any, mapper: (doc: any) => any) {
    console.log(`Migrating ${collectionName}...`);
    const snapshot = await db.collection(collectionName).get();
    let count = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        try {
            await prismaModel.upsert({
                where: { id: doc.id },
                update: mapper({ ...data, id: doc.id }),
                create: mapper({ ...data, id: doc.id }),
            });
            count++;
        } catch (e) {
            console.error(`Error migrating ${collectionName} doc ${doc.id}:`, e);
        }
    }
    console.log(`Finished ${collectionName}: ${count} records migrated.`);
}

async function main() {
    try {
        // 1. Roles
        await migrateCollection('roles', prisma.role, (data) => ({
            id: data.id,
            name: data.name || 'Unknown Role',
            permissions: data.permissions || [],
        }));

        // 2. Branches
        await migrateCollection('branches', prisma.branch, (data) => ({
            id: data.id,
            name: data.name || 'Default Branch',
        }));

        // 3. Areas
        await migrateCollection('areas', prisma.area, (data) => ({
            id: data.id,
            name: data.name || 'Default Area',
            branchId: data.branchId,
        }));

        // 4. Rooms
        await migrateCollection('rooms', prisma.room, (data) => ({
            id: data.id,
            name: data.name || 'Unknown Room',
            capacity: data.capacity || 0,
            elements: data.elements || [],
            areaId: data.areaId,
            weight: data.weight,
        }));

        // 5. Workers
        await migrateCollection('workers', prisma.worker, (data) => ({
            id: data.id,
            workerId: data.workerId,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || `${data.id}@placeholder.com`,
            phone: data.phone || '',
            roleId: data.roleId || 'default-role',
            status: data.status || 'Active',
            avatarUrl: data.avatarUrl || '',
            majorMinistryId: data.majorMinistryId || '',
            minorMinistryId: data.minorMinistryId || '',
            employmentType: data.employmentType,
            birthDate: data.birthDate,
            passwordChangeRequired: data.passwordChangeRequired || false,
            qrToken: data.qrToken,
            createdAt: toDate(data.createdAt),
        }));

        // 6. Ministries
        await migrateCollection('ministries', prisma.ministry, (data) => ({
            id: data.id,
            name: data.name || '',
            description: data.description || '',
            department: mapDepartment(data.department),
            leaderId: data.leaderId || '',
            headId: data.headId,
            approverId: data.approverId,
            mealStubAssignerId: data.mealStubAssignerId,
            mealStubWeeklyLimit: data.mealStubWeeklyLimit,
            weight: data.weight,
        }));

        // 7. Bookings
        await migrateCollection('reservations', prisma.booking, (data) => ({
            id: data.id,
            requestId: data.requestId,
            roomId: data.roomId,
            title: data.title || '',
            purpose: data.purpose,
            start: toDate(data.start),
            end: toDate(data.end),
            status: data.status || 'Pending',
            workerProfileId: data.workerProfileId,
            name: data.name || '',
            ministryId: data.ministryId || '',
            email: data.email || '',
            requesterEmail: data.requesterEmail,
            dateRequested: toDate(data.dateRequested),
            pax: data.pax || 0,
            numTables: data.numTables,
            numChairs: data.numChairs,
            equipment_TV: data.equipment_TV || false,
            equipment_Mic: data.equipment_Mic || false,
            equipment_Speakers: data.equipment_Speakers || false,
            requestedElements: data.requestedElements || [],
            guidelinesAccepted: data.guidelinesAccepted || false,
            checkedInAt: data.checkedInAt ? toDate(data.checkedInAt) : null,
        }));

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
