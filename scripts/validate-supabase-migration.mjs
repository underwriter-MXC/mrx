import { readFile, readdir } from 'node:fs/promises';
import { parse } from 'pgsql-parser';

const migrationDirectory = new URL('../supabase/migrations/', import.meta.url);
const migrationFiles = (await readdir(migrationDirectory))
  .filter((file) => /^\d{14}_[a-z0-9_]+\.sql$/.test(file))
  .sort();

if (!migrationFiles.length) throw new Error('No 14-digit Supabase migrations were found.');

let statementCount = 0;
for (const file of migrationFiles) {
  const sql = await readFile(new URL(file, migrationDirectory), 'utf8');
  const parsed = await parse(sql);
  if (!Array.isArray(parsed.stmts) || !parsed.stmts.length) {
    throw new Error(`${file} parsed without PostgreSQL statements.`);
  }
  statementCount += parsed.stmts.length;
}

if (statementCount < 50) {
  throw new Error(`Migrations parsed but only produced ${statementCount} statements.`);
}

console.log(
  `Migration syntax valid: ${migrationFiles.length} files and ${statementCount} PostgreSQL statements parsed.`,
);
