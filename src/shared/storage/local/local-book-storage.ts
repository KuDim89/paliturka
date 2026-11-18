import { randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { link, mkdir, rm, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';

import type { BookStorage } from '../book-storage';

// Keeps paths safe; not tied to the data model's ID format.
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** Resolves `STORAGE_DIR`: a relative path is taken from `cwd`, an absolute one as is. */
export function resolveStorageRoot(storageDir: string, cwd: string): string {
  return path.resolve(cwd, storageDir);
}

/** Book storage in a local folder: `<root>/books/<userId>/<bookId>.epub`. */
export function createLocalBookStorage(root: string): BookStorage {
  const booksDir = path.resolve(root, 'books');

  // Both checks run before anything touches the disk.
  function insideBooksDir(ids: string[], ...segments: string[]): string {
    for (const id of ids) {
      if (!ID_PATTERN.test(id)) {
        throw new Error('Invalid storage ID: use 1-64 characters A-Z, a-z, 0-9, _ or -.');
      }
    }
    const target = path.resolve(booksDir, ...segments);
    const relative = path.relative(booksDir, target);
    if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error('Storage path is outside the books folder.');
    }
    return target;
  }

  function userDirOf(userId: string): string {
    return insideBooksDir([userId], userId);
  }

  function bookFileOf(userId: string, bookId: string): string {
    return insideBooksDir([userId, bookId], userId, `${bookId}.epub`);
  }

  return {
    async saveBook(userId, bookId, stream) {
      const userDir = userDirOf(userId);
      const file = bookFileOf(userId, bookId);

      // Fails fast before writing; link() below is the atomic check.
      if (await exists(file)) {
        throw new Error('The book already has a file.');
      }

      await mkdir(userDir, { recursive: true });
      // Same folder as the final file, so the link stays on one disk.
      const tempFile = path.join(userDir, `.${bookId}.${randomUUID()}.tmp`);

      try {
        await pipeline(
          Readable.fromWeb(stream as NodeReadableStream<Uint8Array>),
          createWriteStream(tempFile, { flags: 'wx' }),
        );
        // link() fails with EEXIST instead of replacing a file, unlike rename() on Windows.
        await link(tempFile, file);
      } catch (error) {
        await rm(tempFile, { force: true });
        throw error;
      }

      await unlink(tempFile);
      const { size } = await stat(file);
      return { size };
    },

    async openBook(userId, bookId) {
      const file = bookFileOf(userId, bookId);
      try {
        const { size } = await stat(file);
        const stream = Readable.toWeb(createReadStream(file)) as ReadableStream<Uint8Array>;
        return { stream, size };
      } catch (error) {
        if (isNotFound(error)) return null;
        throw error;
      }
    },

    async deleteBook(userId, bookId) {
      await rm(bookFileOf(userId, bookId), { force: true });
    },

    async deleteUserBooks(userId) {
      await rm(userDirOf(userId), { recursive: true, force: true });
    },
  };
}

async function exists(file: string): Promise<boolean> {
  try {
    await stat(file);
    return true;
  } catch (error) {
    if (isNotFound(error)) return false;
    throw error;
  }
}

function isNotFound(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
