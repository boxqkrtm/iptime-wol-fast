import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ENV_PATH = resolve(process.cwd(), '.env');
const KEY = 'WOL_WEB_PASSWORD_HASH';
const args = process.argv.slice(2);
const shouldDisable = args.includes('--clear') || args.includes('--disable');

if (args.length === 0) {
  console.error('Usage: npm run set-password -- <plain password>');
  console.error('       npm run set-password -- --disable');
  process.exit(1);
}

const passwordArg = shouldDisable ? '' : args.join(' ').trim();

if (!shouldDisable && !passwordArg) {
  console.error('Usage: npm run set-password -- <plain password>');
  console.error('       npm run set-password -- --disable');
  process.exit(1);
}

async function run(): Promise<void> {
  const hash = createHash('sha256').update(passwordArg).digest('hex');
  const input = await readFile(ENV_PATH, 'utf8').catch(() => '');
  const rawLines = input.split(/\r?\n/);
  const seen = new Set<string>();
  const nextLines: string[] = [];
  let replaced = false;

  for (const line of rawLines) {
    if (line.startsWith(`${KEY}=`)) {
      if (seen.has(KEY)) {
        continue;
      }

      seen.add(KEY);
      nextLines.push(`${KEY}=${hash}`);
      replaced = true;
      continue;
    }

    nextLines.push(line);
  }

  if (!replaced) {
    nextLines.push(`${KEY}=${hash}`);
  }

  const uniqueJoined = nextLines.join('\n');
  const normalized = uniqueJoined.replace(/\n{3,}/g, '\n\n').replace(/\n*$/, '');

  await writeFile(ENV_PATH, `${normalized}\n`, 'utf8');
  console.log(`[set-password] Updated ${KEY} in ${ENV_PATH}`);
  console.log(hash);
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[set-password] Failed:', message);
  process.exit(1);
});
