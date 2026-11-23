import './globals.css';

// For every URL that matches no route: /uk/missing, /api/..., a missing file. The root layout is
// app/[locale]/layout.tsx, so Next.js needs this separate 404 document (enabled in next.config.ts).
export { NotFoundPage as default } from '@/pages/not-found';
