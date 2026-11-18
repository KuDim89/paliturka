// Runs once when the Next.js server starts.
export async function register() {
  // The storage module needs Node.js file access, which the Edge runtime does not have.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { cleanupLeftoverTempFiles } = await import('@/shared/storage/index.server');
  await cleanupLeftoverTempFiles();
}
