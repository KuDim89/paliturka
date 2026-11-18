/**
 * Book file storage. Callers reach book files only through this interface, so the local folder
 * can be replaced by object storage without changing them.
 *
 * It knows only about files: EPUB checks, size limits, quotas and owner checks belong to the
 * upload flow and the routes.
 */
export interface BookStorage {
  /** Saves a book. Throws if the book already has a file. */
  saveBook(
    userId: string,
    bookId: string,
    stream: ReadableStream<Uint8Array>,
  ): Promise<{ size: number }>;
  /** Opens a book, or returns `null` when it has no file. */
  openBook(
    userId: string,
    bookId: string,
  ): Promise<{ stream: ReadableStream<Uint8Array>; size: number } | null>;
  /** Deletes a book file; succeeds when it is already missing. */
  deleteBook(userId: string, bookId: string): Promise<void>;
  /** Deletes all of a user's book files; succeeds when there are none. */
  deleteUserBooks(userId: string): Promise<void>;
}
