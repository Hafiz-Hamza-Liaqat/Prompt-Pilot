import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const outputPath = join('src', 'types', 'database.ts');
mkdirSync(dirname(outputPath), { recursive: true });

const generated = execSync(
  'supabase gen types typescript --local --schema public',
  { encoding: 'utf8' },
);

writeFileSync(outputPath, generated, 'utf8');
