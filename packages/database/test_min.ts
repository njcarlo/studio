import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const ministry = await prisma.ministry.create({
      data: {
        id: 'T-Test',
        name: 'Test',
        description: '',
        leaderId: '',
        weight: 0,
        department: {
          connect: { code: 'W' }
        }
      }
    });
    console.log("Success:", ministry);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
