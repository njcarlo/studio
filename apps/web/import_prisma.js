const { PrismaClient, Department } = require('@prisma/client');
const fs = require('fs');
const readline = require('readline');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting data import via Prisma...');

    // 1. Determine a default role
    let role = await prisma.role.findFirst({ where: { name: 'Worker' } });
    if (!role) {
        // Fallback to finding any role, or create one
        role = await prisma.role.findFirst();
        if (!role) {
            console.log('No roles found in DB, creating a default "Worker" role.');
            role = await prisma.role.create({
                data: {
                    name: 'Worker',
                    permissions: []
                }
            });
        }
    }
    const defaultRoleId = role.id;
    console.log(`Using Role ID: ${defaultRoleId} for workers.`);

    // 2. Insert Ministries
    const ministryData = JSON.parse(fs.readFileSync('ministry.json', 'utf8'));
    console.log(`Parsed ${Object.keys(ministryData).length} ministries from JSON.`);
    
    let ministryCount = 0;
    for (const key of Object.keys(ministryData)) {
        const m = ministryData[key];
        
        // Upsert to avoid conflicts if previously imported
        await prisma.ministry.upsert({
            where: { id: m.id.toString() },
            update: {
                name: m.name,
                department: m.department
            },
            create: {
                id: m.id.toString(),
                name: m.name,
                description: '',
                department: m.department,
                leaderId: 'Unassigned',
            }
        });
        ministryCount++;
    }
    console.log(`Successfully verified/inserted ${ministryCount} ministries.`);

    // 3. Process Workers from the SQL dump directly
    const rl = readline.createInterface({
        input: fs.createReadStream('workers-trimmed.sql'),
        crlfDelay: Infinity
    });

    const workersToInsert = [];

    function parseValues(rowStr) {
        let vals = [];
        let current = '';
        let inString = false;
        let escape = false;
        for (let i = 0; i < rowStr.length; i++) {
            const c = rowStr[i];
            if (escape) { current += c; escape = false; }
            else if (c === '\\') { current += c; escape = true; }
            else if (c === "'") { inString = !inString; current += c; }
            else if (c === ',' && !inString) { vals.push(current.trim()); current = ''; }
            else { current += c; }
        }
        vals.push(current.trim());
        return vals;
    }

    // Indices in workers-trimmed.sql based on our trimming script:
    // targetColNames = ['id', 'first_name', 'last_name', 'email', 'password', 'mobile', 'area_id', 'birthdate', 'ministry_id', 'status', 'sys_update_date', 'remarks', 'qrdata', 'worker_status', 'worker_type'];
    // 0: id
    // 1: first_name
    // 2: last_name
    // 3: email
    // 4: password
    // 5: mobile
    // 6: area_id
    // 7: birthdate
    // 8: ministry_id
    // 9: status
    // 10: sys_update_date
    // 11: remarks
    // 12: qrdata
    // 13: worker_status
    // 14: worker_type

    console.log('Parsing workers-trimmed.sql...');
    let skipped = 0;
    
    for await (const line of rl) {
        if (!line.trim().startsWith('(')) continue;

        const match = line.match(/^\s*\((.*)\)\s*([,;]?)\s*$/);
        if (!match) continue;

        const vals = parseValues(match[1]);
        if (vals.length < 15) {
            continue;
        }

        // Clean values safely
        const id = vals[0].replace(/^'|'$/g, '');
        const firstName = vals[1].replace(/^'|'$/g, '');
        const lastName = vals[2].replace(/^'|'$/g, '');
        let email = vals[3].replace(/^'|'$/g, '');
        const phone = vals[5].replace(/^'|'$/g, '');
        let birthDate = vals[7] === 'NULL' ? null : vals[7].replace(/^'|'$/g, '');
        let ministryId = vals[8] === 'NULL' || vals[8] === '0' || vals[8] === '' ? '0' : vals[8].replace(/^'|'$/g, '');
        
        let rawStatus = vals[9].replace(/^'|'$/g, '');
        let mappedStatus = 'Inactive';
        if (rawStatus.toLowerCase() === 'active') mappedStatus = 'Active';
        
        let empTypeRaw = vals[14].replace(/^'|'$/g, '');
        let mappedEmpType = 'Volunteer'; // 'Full-Time' | 'On-Call' | 'Volunteer'
        if (empTypeRaw.toLowerCase().includes('full')) mappedEmpType = 'Full-Time';
        if (empTypeRaw.toLowerCase().includes('call')) mappedEmpType = 'On-Call';

        const qrToken = vals[12].replace(/^'|'$/g, '');
        
        if (email === 'NULL' || !email.includes('@')) {
            // Generate a fake email if missing/invalid to comply with unique requirement
            email = `worker_${id}@no-email.app`;
        }

        workersToInsert.push({
            id: id,
            firstName: firstName || 'Unknown',
            lastName: lastName || 'Unknown',
            email: email.toLowerCase(),
            phone: phone || '',
            roleId: defaultRoleId,
            status: mappedStatus,
            avatarUrl: '',
            majorMinistryId: ministryId,
            minorMinistryId: '0',
            employmentType: mappedEmpType,
            birthDate: birthDate,
            qrToken: qrToken || null,
            passwordChangeRequired: false
        });
    }

    console.log(`Parsed ${workersToInsert.length} workers.`);
    
    // We process inserts in chunks to prevent memory or connection limits
    console.log('Inserting workers to db...');
    const chunkSize = 500;
    let inserted = 0;
    
    // Prisma createMany ignores duplicates when skipDuplicates: true
    for (let i = 0; i < workersToInsert.length; i += chunkSize) {
        const chunk = workersToInsert.slice(i, i + chunkSize);
        
        try {
            await prisma.worker.createMany({
                data: chunk,
                skipDuplicates: true
            });
            inserted += chunk.length;
            console.log(`Inserted chunk... (${inserted}/${workersToInsert.length})`);
        } catch (e) {
            console.log('Error creating chunk: ' + e.message);
        }
    }

    console.log('Import Finished Successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
