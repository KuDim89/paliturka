import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Last, so formatting rules that conflict with Prettier are turned off.
  prettier,
  // Replaces the default ignores of eslint-config-next, so they are repeated here.
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'storage/**']),
]);

export default eslintConfig;
