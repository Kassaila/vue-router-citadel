import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

import localPlugin from './eslint-plugins/local';

export default defineConfig(
  { ignores: ['dist/**', 'coverage/**', 'docs/**', 'temp/**', 'eslint-plugins/**', '*.config.*'] },

  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  eslintConfigPrettier,

  {
    plugins: { local: localPlugin },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript (type-aware)
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // JavaScript
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'curly': ['error', 'all'],

      // Local rules
      'local/switch-case-braces': 'error',
      'local/jsdoc-comment-style': 'error',
      'local/prefer-arrow-without-this': 'error',
    },
  },

  // Disable type-checked rules for files not in tsconfig
  {
    files: ['__tests__/**', 'eslint-plugins/**'],
    ...tseslint.configs.disableTypeChecked,
  },

  // DevTools: DevToolsApi is intentionally `any` (type conflicts between @vue/devtools-api and @vue/devtools-kit)
  {
    files: ['src/devtools/**'],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
    },
  },
);
