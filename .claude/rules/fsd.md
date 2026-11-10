---
paths:
  - "app/**/*"
  - "src/**/*"
---

# Feature-Sliced Design with Next.js

- **Folders:** the Next.js `app/` folder is at the repo root; FSD layers are in `src/`. If Next.js picks up `src/pages` as routes, add an empty `pages/` folder at the root.
- **Routes stay thin:** a route only re-exports a page, for example `export { HomePage as default } from '@/pages/home'`. `layout.tsx`, `loading.tsx`, `error.tsx` and SEO metadata live in the root `app/` and take their content from FSD.
- **Server and client code:** a slice keeps them in separate entry points, `index.ts` and `server.ts`. Server modules import `server-only`, so server code cannot reach the client bundle.
- **Server code:** route handlers live in `app/api`. Their logic and database access live in the `api` segments of slices or in `shared`.
- **Links between slices:** slices of the same layer do not import each other. Use the FSD `@x` notation (for example, between `annotation` and `book`) or pass data through a higher layer.
- **Layers are added gradually:** start with `pages`, `entities` and `shared`. Add `features` and `widgets` when they are needed.
- **Linting:** Steiger checks the FSD rules.
