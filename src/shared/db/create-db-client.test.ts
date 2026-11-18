import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, test } from 'vitest';

import { createDbClient } from './create-db-client';

test('connects to a SQLite file in a new folder and leaves nothing behind', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'paliturka-db-'));
  const file = path.join(root, 'nested', 'test.db');
  const db = createDbClient(`file:${file}`);

  try {
    const rows = await db.$queryRaw<{ ok: bigint }[]>`SELECT 1 AS ok`;

    expect(rows).toEqual([{ ok: BigInt(1) }]);
    expect(existsSync(file)).toBe(true);
  } finally {
    await db.$disconnect();
    await rm(root, { recursive: true, force: true });
  }

  expect(existsSync(root)).toBe(false);
});
