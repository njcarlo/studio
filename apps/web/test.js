const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
    console.log("Checking columns...");
    const cols = await prisma.$queryRawUnsafe("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tract_users'");
    console.log('COLUMNS:', cols);
    const rows = await prisma.$queryRawUnsafe("SELECT * FROM public.tract_users LIMIT 5");
    console.log('ROWS:', rows);
}
check()
  .then(()=>process.exit(0))
  .catch(e=>{console.error("ERROR", e);process.exit(1)});
