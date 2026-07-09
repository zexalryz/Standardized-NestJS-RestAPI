#!/usr/bin/env node
import { copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const providers = ['postgresql', 'mysql', 'sqlite', 'sqlserver', 'mongodb'];

const providerMap = {
  postgres: 'postgresql',
  pg: 'postgresql',
  postgresql: 'postgresql',
  mysql: 'mysql',
  sqlite: 'sqlite',
  sqlserver: 'sqlserver',
  mssql: 'sqlserver',
  mongodb: 'mongodb',
  mongo: 'mongodb',
};

const input = process.argv[2]?.toLowerCase();
const provider = providerMap[input];

if (!provider) {
  console.error(`Usage: node scripts/switch-db.mjs <provider>`);
  console.error(`Providers: ${Object.keys(providerMap).join(', ')}`);
  process.exit(1);
}

const src = join(root, 'prisma', 'providers', `schema.${provider}.prisma`);
const dst = join(root, 'prisma', 'schema.prisma');

if (!existsSync(src)) {
  console.error(`Schema file not found: ${src}`);
  process.exit(1);
}

copyFileSync(src, dst);
console.log(`Switched to ${provider} (schema.prisma updated)`);

// Print matching DATABASE_URL hint
const examples = {
  postgresql: 'postgresql://user:pass@localhost:5432/mydb',
  mysql: 'mysql://user:pass@localhost:3306/mydb',
  sqlite: 'file:./dev.db',
  sqlserver: 'sqlserver://localhost:1433;database=mydb;user=sa;password=pass;trustServerCertificate=true',
  mongodb: 'mongodb://localhost:27017/mydb',
};
console.log(`Hint: set DATABASE_URL in .env, e.g.:`);
console.log(`  DATABASE_URL=${examples[provider]}`);
