import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const codes = ['INVITE-2024-001', 'INVITE-2024-002', 'INVITE-2024-003', 'INVITE-2024-004', 'INVITE-2024-005'];

  for (const code of codes) {
    await prisma.inviteCode.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }

  console.log(`Seeded ${codes.length} invite codes`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
