import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Database } from 'bun:sqlite';

const litefsDir = process.env.NODE_ENV === 'production' ? '/var/lib/litefs' : './litefs';
const litefsPath = join(litefsDir, 'db.sqlite');

if (!existsSync(litefsDir)) {
  console.error('Unable to reach LiteFS directory at', litefsDir);
  process.exit(1);
}

export const db = new Database(litefsPath);