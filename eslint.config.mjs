import { fixupConfigRules, includeIgnoreFile } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import vercelNode from '@vercel/style-guide/eslint/node';
import vercelTypescript from '@vercel/style-guide/eslint/typescript';
import vitest from '@vercel/style-guide/eslint/vitest';
import globals from 'globals';
import { dirname, resolve } from 'node:path';
import ts from 'typescript-eslint';
import { fileURLToPath } from 'url';

const __fileName = fileURLToPath(import.meta.url);
const __dirname = dirname(__fileName);
const compat = new FlatCompat({
  allConfig: js.configs.all,
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});
const gitIgnorePath = resolve(__dirname, '.gitignore');

/** @type {import('eslint').Linter.Config} */
export default ts.config(
  includeIgnoreFile(gitIgnorePath),
  {
    files: ['**/*.ts'],
    ignores: ['**/node_modules/**', '*.js', 'dist'],
  },
  js.configs.recommended,
  ...compat.env(vercelNode.env),
  ...compat.config(vercelNode),
  ...fixupConfigRules(compat.config(vercelTypescript)),
  ...fixupConfigRules(compat.config(vitest)),
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: { project: true, tsconfigRootDir: import.meta.dirname },
    },
  },
);
