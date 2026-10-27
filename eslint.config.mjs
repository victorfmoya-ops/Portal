import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: ['.next/**', 'node_modules/**', 'referencia/**', 'coverage/**', 'playwright-report/**', 'test-results/**', 'lib/database.types.ts', 'next-env.d.ts', 'infra/**'],
  },
];

export default config;
