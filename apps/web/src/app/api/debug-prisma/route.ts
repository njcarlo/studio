import { prisma } from '@studio/database/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const keys = Object.keys(prisma);
    const hasMealStub = 'mealStub' in prisma;
    const workerKeys = Object.keys((prisma as any).worker || {});
    
    // Check if it's a proxy and try to access a model to force initialization
    let modelAccess = 'failure';
    try {
        if ((prisma as any).worker) modelAccess = 'success';
    } catch (e) {}

    return NextResponse.json({
      instanceType: typeof prisma,
      constructorName: (prisma as any).constructor?.name,
      asString: typeof prisma === 'function' ? prisma.toString() : 'not a function',
      prismaKeys: keys,
      hasMealStubProperty: hasMealStub,
      workerKeys: workerKeys,
      modelAccess: modelAccess,
      env: process.env.NODE_ENV,
      clientVersion: (prisma as any)._clientVersion,
      globalPrismaType: typeof (globalThis as any).prisma,
      workerCount: await prisma.worker.count(),
      sampleWorker: await prisma.worker.findFirst({ select: { id: true, email: true } })
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
