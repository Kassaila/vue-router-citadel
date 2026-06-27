import { tsConfig } from 'eslint-plugin-kassaila/configs/ts';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'docs/**', 'temp/**', '*.config.*', '.size-limit.cjs'],
  },

  ...tsConfig,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Ops scripts: standalone Node utilities outside the src tsconfig — lint without
  // type-aware rules (no project service)
  {
    files: ['scripts/**'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['scripts/**'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      // CLI utilities legitimately write progress to stdout
      'no-console': 'off',
    },
  },

  // Tests: disable type-checked rules and allow non-null assertions
  {
    files: ['__tests__/**'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['__tests__/**'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
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
];
