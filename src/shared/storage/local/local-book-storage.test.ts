import { randomBytes } from 'node:crypto';
import { mkdir, mkdtemp, readdir, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  cleanupTempFilesAtStartup,
  createLocalBookStorage,
  resolveStorageRoot,
  TEMP_FILE_PATTERN,
  tempFileName,
} from './local-book-storage';
import type { LocalBookStorage } from './local-book-storage';

let root: string;
let storage: LocalBookStorage;

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'paliturka-storage-'));
  storage = createLocalBookStorage(root);
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

function streamOf(...chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

function failingStream(chunk: Uint8Array): ReadableStream<Uint8Array> {
  let sent = false;
  return new ReadableStream({
    pull(controller) {
      if (!sent) {
        sent = true;
        controller.enqueue(chunk);
      } else {
        controller.error(new Error('connection lost'));
      }
    },
  });
}

async function readAll(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  return Buffer.from(await new Response(stream).arrayBuffer());
}

function userDir(userId: string): string {
  return path.join(root, 'books', userId);
}

function bookPath(userId: string, bookId: string): string {
  return path.join(userDir(userId), `${bookId}.epub`);
}

async function listTree(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true });
  return entries.map(String).sort();
}

describe('saveBook and openBook', () => {
  test('openBook returns the same bytes and size that saveBook stored', async () => {
    const bytes = randomBytes(200 * 1024);
    const half = bytes.length / 2;

    const saved = await storage.saveBook(
      'user-1',
      'book-1',
      streamOf(bytes.subarray(0, half), bytes.subarray(half)),
    );
    const opened = await storage.openBook('user-1', 'book-1');

    expect(saved.size).toBe(bytes.length);
    expect(opened?.size).toBe(saved.size);
    expect((await readAll(opened!.stream)).equals(bytes)).toBe(true);
  });

  test('stores the file at books/<userId>/<bookId>.epub with no temporary files left', async () => {
    await storage.saveBook('user-1', 'book-1', streamOf(randomBytes(1024)));

    expect(await readdir(userDir('user-1'))).toEqual(['book-1.epub']);
  });

  test('refuses to overwrite an existing file and leaves it unchanged', async () => {
    const original = randomBytes(1024);
    await storage.saveBook('user-1', 'book-1', streamOf(original));

    await expect(
      storage.saveBook('user-1', 'book-1', streamOf(randomBytes(2048))),
    ).rejects.toThrow();

    expect((await readFile(bookPath('user-1', 'book-1'))).equals(original)).toBe(true);
    expect(await readdir(userDir('user-1'))).toEqual(['book-1.epub']);
  });

  test('leaves no book and no temporary file when the input stream fails', async () => {
    await expect(
      storage.saveBook('user-1', 'book-1', failingStream(randomBytes(1024))),
    ).rejects.toThrow('connection lost');

    expect(await readdir(userDir('user-1'))).toEqual([]);
  });

  test('openBook returns null for a missing file', async () => {
    expect(await storage.openBook('user-1', 'missing')).toBeNull();
  });
});

describe('deleteBook', () => {
  test('removes the file and does not throw when called again', async () => {
    await storage.saveBook('user-1', 'book-1', streamOf(randomBytes(1024)));

    await storage.deleteBook('user-1', 'book-1');
    await expect(storage.deleteBook('user-1', 'book-1')).resolves.toBeUndefined();

    expect(await storage.openBook('user-1', 'book-1')).toBeNull();
  });
});

describe('deleteUserBooks', () => {
  test("removes the user's folder and leaves other users' files", async () => {
    await storage.saveBook('user-1', 'book-1', streamOf(randomBytes(1024)));
    await storage.saveBook('user-1', 'book-2', streamOf(randomBytes(1024)));
    await storage.saveBook('user-2', 'book-3', streamOf(randomBytes(1024)));

    await storage.deleteUserBooks('user-1');

    expect(await readdir(path.join(root, 'books'))).toEqual(['user-2']);
    expect(await storage.openBook('user-2', 'book-3')).not.toBeNull();
  });

  test('does not throw when the user has no folder', async () => {
    await expect(storage.deleteUserBooks('nobody')).resolves.toBeUndefined();
  });
});

describe('ID validation', () => {
  const invalidIds = ['../x', 'a/b', 'a\\b', '', 'a'.repeat(65)];

  const calls: Record<string, (id: string) => Promise<unknown>> = {
    'saveBook (userId)': (id) => storage.saveBook(id, 'book-1', streamOf(randomBytes(16))),
    'saveBook (bookId)': (id) => storage.saveBook('user-1', id, streamOf(randomBytes(16))),
    'openBook (userId)': (id) => storage.openBook(id, 'book-1'),
    'openBook (bookId)': (id) => storage.openBook('user-1', id),
    'deleteBook (userId)': (id) => storage.deleteBook(id, 'book-1'),
    'deleteBook (bookId)': (id) => storage.deleteBook('user-1', id),
    'deleteUserBooks (userId)': (id) => storage.deleteUserBooks(id),
  };

  describe.each(Object.entries(calls))('%s', (_name, call) => {
    test.each(invalidIds)('throws for %j and changes nothing', async (id) => {
      // A decoy next to books/ and a user folder named like the traversal target.
      await mkdir(path.join(root, 'x'), { recursive: true });
      await writeFile(path.join(root, 'x', 'decoy.epub'), 'decoy');
      await mkdir(userDir('a'), { recursive: true });
      await writeFile(bookPath('a', 'b'), 'book');
      const before = await listTree(root);

      await expect(call(id)).rejects.toThrow(/Invalid storage ID/);

      expect(await listTree(root)).toEqual(before);
    });
  });

  test('accepts the full 64-character ID', async () => {
    const id = 'A'.repeat(64);
    await storage.saveBook(id, 'book-1', streamOf(randomBytes(16)));

    expect(await storage.openBook(id, 'book-1')).not.toBeNull();
  });
});

describe('resolveStorageRoot', () => {
  const cwd = path.resolve('/project');

  test('resolves the default ./storage from the project root', () => {
    expect(resolveStorageRoot('./storage', cwd)).toBe(path.join(cwd, 'storage'));
  });

  test('keeps an absolute STORAGE_DIR as is', () => {
    const absolute = path.resolve('/data/books');
    expect(resolveStorageRoot(absolute, cwd)).toBe(absolute);
  });
});

describe('cleanupTempFiles', () => {
  async function putFile(userId: string, name: string): Promise<string> {
    await mkdir(userDir(userId), { recursive: true });
    const file = path.join(userDir(userId), name);
    await writeFile(file, 'partial');
    return file;
  }

  test('the temporary file name from saveBook matches the cleanup pattern', () => {
    expect(TEMP_FILE_PATTERN.test(tempFileName('book-1'))).toBe(true);
  });

  test('removes a temporary file whatever its age', async () => {
    const file = await putFile('user-1', tempFileName('book-1'));
    // A file from long ago and one written a moment ago are both leftovers at startup.
    await utimes(file, new Date('2020-01-01'), new Date('2020-01-01'));
    await putFile('user-1', tempFileName('book-2'));

    expect(await storage.cleanupTempFiles()).toBe(2);
    expect(await readdir(userDir('user-1'))).toEqual([]);
  });

  test('keeps book files and files that do not match the pattern', async () => {
    await storage.saveBook('user-1', 'book-1', streamOf(randomBytes(16)));
    const kept = ['notes.tmp', '.book-1.tmp', 'book-2.epub.tmp', '.book-1.not-a-uuid.tmp'];
    for (const name of kept) await putFile('user-1', name);
    await putFile('user-1', tempFileName('book-3'));

    expect(await storage.cleanupTempFiles()).toBe(1);
    expect((await readdir(userDir('user-1'))).sort()).toEqual(['book-1.epub', ...kept].sort());
  });

  test("removes temporary files in every user's folder and returns the total", async () => {
    await putFile('user-1', tempFileName('book-1'));
    await putFile('user-1', tempFileName('book-2'));
    await putFile('user-2', tempFileName('book-3'));

    expect(await storage.cleanupTempFiles()).toBe(3);
    expect(await readdir(userDir('user-1'))).toEqual([]);
    expect(await readdir(userDir('user-2'))).toEqual([]);
  });

  test('returns 0 when the books folder does not exist', async () => {
    expect(await storage.cleanupTempFiles()).toBe(0);
  });
});

describe('cleanupTempFilesAtStartup', () => {
  function fakeLogger() {
    return { info: vi.fn(), error: vi.fn() };
  }

  test('logs how many files were removed', async () => {
    const logger = fakeLogger();

    await cleanupTempFilesAtStartup({ cleanupTempFiles: async () => 2 }, logger);

    expect(logger.info).toHaveBeenCalledWith(
      '[storage] Removed 2 leftover temporary book file(s).',
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  test('logs nothing when nothing was removed', async () => {
    const logger = fakeLogger();

    await cleanupTempFilesAtStartup({ cleanupTempFiles: async () => 0 }, logger);

    expect(logger.info).not.toHaveBeenCalled();
  });

  test('logs a failure instead of throwing', async () => {
    const logger = fakeLogger();
    const failure = new Error('EPERM');

    await expect(
      cleanupTempFilesAtStartup(
        {
          cleanupTempFiles: async () => {
            throw failure;
          },
        },
        logger,
      ),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      '[storage] Failed to clean up temporary book files:',
      failure,
    );
  });
});
