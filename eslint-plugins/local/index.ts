/**
 * Local ESLint Plugin
 *
 * Custom ESLint rules for this project.
 *
 * Usage in eslint.config.ts:
 *   import localPlugin from './eslint-plugins/local';
 *   // ...
 *   {
 *     plugins: { local: localPlugin },
 *     rules: { 'local/switch-case-braces': 'error' }
 *   }
 */

import type { ESLint } from 'eslint';

import jsdocCommentStyle from './rules/jsdoc-comment-style';
import preferArrowWithoutThis from './rules/prefer-arrow-without-this';
import switchCaseBraces from './rules/switch-case-braces';

const plugin: ESLint.Plugin = {
  meta: {
    name: 'eslint-plugin-local',
    version: '1.0.0',
  },
  rules: {
    'jsdoc-comment-style': jsdocCommentStyle as never,
    'prefer-arrow-without-this': preferArrowWithoutThis as never,
    'switch-case-braces': switchCaseBraces as never,
  },
};

export default plugin;
