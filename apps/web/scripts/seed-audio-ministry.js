/**
 * seed-audio-ministry.js
 *
 * Creates:
 *   1. An "Audio Ministry" document under /ministries
 *   2. 9 dummy workers (3 Full-Time, 3 On-Call, 3 Volunteer)
 *      all assigned to the Audio Ministry as majorMinistryId
 *   3. One of the Full-Time workers is set as the ministry's mealStubAssigner
 *
 * Run with:
 *   node apps/web/scripts/seed-audio-ministry.js
 */

const admin = require('firebase-admin');

if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: 'studio-3072837227-9a1db' });
}

const db = admin.firestore();

const MINISTRY_ID = 'W-Audio Ministry';

// ---------------------------------------------------------------------------
// Workers — 3 Full-Time, 3 On-Call, 3 Volunteer
// ---------------------------------------------------------------------------
const workers = [
    // Full-Time
    {
        id: 'audio-ft-001',
        firstName: 'Marco',
        lastName: 'Reyes',
        email: 'marco.reyes@cogapp.local',
        phone: '09171000001',
        roleId: 'editor',
        status: 'Active',
        employmentType: 'Full-Time',
        majorMinistryId: MINISTRY_ID,
        minorMinistryId: '',
        workerId: 'AUD-FT-001',
        avatarUrl: '',
        birthDate: '1992-03-15',
    },
    {
        id: 'audio-ft-002',
        firstName: 'Danielle',
        lastName: 'Santos',
        email: 'danielle.santos@cogapp.local',
        phone: '09171000002',
        roleId: 'editor',
        status: 'Active',
        employmentType: 'Full-Time',
        majorMinistryId: MINISTRY_ID,
        minorMinistryId: '',
        workerId: 'AUD-FT-002',
        avatarUrl: '',
        birthDate: '1994-07-22',
    },
    {
        id: 'audio-ft-003',
        firstName: 'Renz',
        lastName: 'Villanueva',
        email: 'renz.villanueva@cogapp.local',
        phone: '09171000003',
        roleId: 'editor',
        status: 'Active',
        employmentType: 'Full-Time',
        majorMinistryId: MINISTRY_ID,
        minorMinistryId: '',
        workerId: 'AUD-FT-003',
        avatarUrl: '',
        birthDate: '1990-11-05',
    },

    // On-Call
    {
        id: 'audio-oc-001',
        firstName: 'Lara',
        lastName: 'Castillo',
        email: 'lara.castillo@cogapp.local',
        phone: '09182000001',
        roleId: 'viewer',
        status: 'Active',
        employmentType: 'On-Call',
        majorMinistryId: MINISTRY_ID,
        minorMinistryId: '',
        workerId: 'AUD-OC-001',
        avatarUrl: '',
        birthDate: '1997-01-30',
    },
    {
        id: 'audio-oc-002',
        firstName: 'Erwin',
        lastName: 'Dela Cruz',
        email: 'erwin.delacruz@cogapp.local',
        phone: '09182000002',
        roleId: 'viewer',
        status: 'Active',
        employmentType: 'On-Call',
        majorMinistryId: MINISTRY_ID,
        minorMinistryId: '',
        workerId: 'AUD-OC-002',
        avatarUrl: '',
        birthDate: '1999-08-14',
    },
    {
        id: 'audio-oc-003',
        firstName: 'Precious',
        lastName: 'Abad',
        email: 'precious.abad@cogapp.local',
        phone: '09182000003',
        roleId: 'viewer',
        status: 'Active',
        employmentType: 'On-Call',
        majorMinistryId: MINISTRY_ID,
        minorMinistryId: '',
        workerId: 'AUD-OC-003',
        avatarUrl: '',
        birthDate: '2001-04-09',
    },

    // Volunteer
    {
        id: 'audio-vol-001',
        firstName: 'Janine',
        lastName: 'Ocampo',
        email: 'janine.ocampo@cogapp.local',
        phone: '09193000001',
        roleId: 'viewer',
        status: 'Active',
        employmentType: 'Volunteer',
        majorMinistryId: MINISTRY_ID,
        minorMinistryId: '',
        workerId: 'AUD-VOL-001',
        avatarUrl: '',
        birthDate: '2000-06-18',
    },
    {
        id: 'audio-vol-002',
        firstName: 'Kenneth',
        lastName: 'Flores',
        email: 'kenneth.flores@cogapp.local',
        phone: '09193000002',
        roleId: 'viewer',
        status: 'Active',
        employmentType: 'Volunteer',
        majorMinistryId: MINISTRY_ID,
        minorMinistryId: '',
        workerId: 'AUD-VOL-002',
        avatarUrl: '',
        birthDate: '2003-09-25',
    },
    {
        id: 'audio-vol-003',
        firstName: 'Sophia',
        lastName: 'Bautista',
        email: 'sophia.bautista@cogapp.local',
        phone: '09193000003',
        roleId: 'viewer',
        status: 'Active',
        employmentType: 'Volunteer',
        majorMinistryId: MINISTRY_ID,
        minorMinistryId: '',
        workerId: 'AUD-VOL-003',
        avatarUrl: '',
        birthDate: '2002-12-01',
    },
];

// The Full-Time worker who acts as the meal stub assigner
const ASSIGNER_ID = 'audio-ft-001'; // Marco Reyes

async function seed() {
    console.log('\n🎙️  Seeding Audio Ministry...\n');

    // 1. Create / overwrite the ministry document
    await db.collection('ministries').doc(MINISTRY_ID).set({
        id: MINISTRY_ID,
        name: 'Audio Ministry',
        description: 'Responsible for sound mixing, amplification, and overall audio quality during services and events.',
        department: 'Worship',
        leaderId: 'audio-ft-001',
        headId: 'audio-ft-002',
        approverId: '',
        mealStubAssignerId: ASSIGNER_ID,
        mealStubWeeklyLimit: 30,
        weight: 2,
    }, { merge: true });
    console.log(`  ✅  Ministry created: ${MINISTRY_ID}`);

    // 2. Write worker documents
    const batch = db.batch();
    for (const w of workers) {
        const ref = db.collection('workers').doc(w.id);
        batch.set(ref, {
            ...w,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    await batch.commit();

    const ftCount = workers.filter(w => w.employmentType === 'Full-Time').length;
    const ocCount = workers.filter(w => w.employmentType === 'On-Call').length;
    const volCount = workers.filter(w => w.employmentType === 'Volunteer').length;

    console.log(`  ✅  Workers created:`);
    console.log(`      Full-Time : ${ftCount}  (${workers.filter(w => w.employmentType === 'Full-Time').map(w => `${w.firstName} ${w.lastName}`).join(', ')})`);
    console.log(`      On-Call   : ${ocCount}  (${workers.filter(w => w.employmentType === 'On-Call').map(w => `${w.firstName} ${w.lastName}`).join(', ')})`);
    console.log(`      Volunteer : ${volCount}  (${workers.filter(w => w.employmentType === 'Volunteer').map(w => `${w.firstName} ${w.lastName}`).join(', ')})`);
    console.log(`\n  🍽️  Meal Stub Assigner: Marco Reyes (${ASSIGNER_ID})`);
    console.log(`  📛  Ministry ID (for workers page): ${MINISTRY_ID}`);
    console.log('\n✔  Done.\n');
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
