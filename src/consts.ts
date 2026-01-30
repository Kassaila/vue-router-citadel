/**
 * Development mode detection
 * - Vite: import.meta.env.DEV
 * - Node.js/Webpack: process.env.NODE_ENV
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export const __DEV__: boolean =
  typeof (import.meta as any)?.env !== 'undefined'
    ? Boolean((import.meta as any).env.DEV)
    : (globalThis as any).process?.env?.NODE_ENV !== 'production';
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Log prefix for console messages
 */
export const LOG_PREFIX = '[🏰 NavigationCitadel]';

/**
 * Default priority for navigation outposts
 */
export const DEFAULT_NAVIGATION_OUTPOST_PRIORITY = 100;
