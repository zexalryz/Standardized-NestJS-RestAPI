const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Seed users with roles
  const users = [
    { username: 'admin', email: 'admin@example.com', password: 'Admin1234', role: 'ADMIN' },
    { username: 'mod', email: 'mod@example.com', password: 'Mod1234', role: 'MODERATOR' },
    { username: 'donor', email: 'donor@example.com', password: 'Donor1234', role: 'DONATOR' },
  ];

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where: { username: u.username },
      update: { role: u.role },
      create: { username: u.username, email: u.email, password: hashed, role: u.role },
    });
    console.log('  user: ' + u.username + ' (' + u.role + ')');
  }

  // Seed invite codes
  const codes = ['INVITE-2024-001', 'INVITE-2024-002', 'INVITE-2024-003', 'INVITE-2024-004', 'INVITE-2024-005'];
  for (const code of codes) {
    await prisma.inviteCode.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }

  console.log(`Seeded ${users.length} users and ${codes.length} invite codes`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
