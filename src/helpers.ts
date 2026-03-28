import { LOG_PREFIX } from './consts';
import type { CitadelLogger, DebugHandler, DebugPoint } from './types';

/**
 * Creates default console logger with prefix and emoji indicators.
 *
 * Log levels:
 * - 🔵 info: Navigation flow, outpost deployment
 * - 🟡 warn: Blocked navigation, missing routes, duplicates
 * - 🔴 error: Outpost errors, timeouts
 * - 🟣 debug: Debug breakpoints
 */
/* eslint-disable no-console */
export const createDefaultLogger = (): CitadelLogger => ({
  info: (...args) => console.info(`🔵 ${LOG_PREFIX}`, ...args),
  warn: (...args) => console.log(`🟡 ${LOG_PREFIX}`, ...args),
  error: (...args) => console.error(`🔴 ${LOG_PREFIX}`, ...args),
  debug: (...args) => console.log(`🟣 ${LOG_PREFIX} [DEBUG]`, ...args),
});
/* eslint-enable no-console */

/**
 * Default debug handler - triggers debugger statement.
 * Note: Bundlers in consuming projects (Vite/esbuild) may strip this.
 * For reliable breakpoints, provide your own debugHandler in options.
 */
export const createDefaultDebugHandler = (): DebugHandler => () => {
  // eslint-disable-next-line no-debugger
  debugger;
};

/**
 * Triggers a named debug point with console output and optional custom handler
 */
export const debugPoint = (
  name: DebugPoint,
  debug: boolean,
  logger: CitadelLogger,
  debugHandler?: DebugHandler,
): void => {
  if (debug) {
    logger.debug(name);
    debugHandler?.(name);
  }
};
