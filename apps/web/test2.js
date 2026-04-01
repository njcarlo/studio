const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
    console.log("Checking columns...");
    const rows = await prisma.$queryRawUnsafe(`
        SELECT column_name, data_type, character_maximum_length, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'tract_users'
    `);
    console.log(JSON.stringify(rows, null, 2));

    const checkConstraints = await prisma.$queryRawUnsafe(`
        SELECT conname, pg_get_constraintdef(c.oid)
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'tract_users'
    `);
    console.log("CONSTRAINTS:", JSON.stringify(checkConstraints, null, 2));
}
check()
  .then(()=>process.exit(0))
  .catch(e=>{console.error("ERROR", e);process.exit(1)});
