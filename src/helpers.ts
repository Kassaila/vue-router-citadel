import { LOG_PREFIX } from './consts';
import type { CitadelLogger, DebugPoint } from './types';

/**
 * Creates default console logger with prefix and emoji indicators.
 *
 * Log levels:
 * - 🔵 info: Navigation flow, outpost deployment
 * - 🟡 warn: Blocked navigation, missing routes, duplicates
 * - 🔴 error: Outpost errors, timeouts
 * - 🟣 debug: Debug breakpoints
 */
export const createDefaultLogger = (): CitadelLogger => ({
  info: (...args) => console.info(`🔵 ${LOG_PREFIX}`, ...args),
  warn: (...args) => console.log(`🟡 ${LOG_PREFIX}`, ...args),
  error: (...args) => console.error(`🔴 ${LOG_PREFIX}`, ...args),
  debug: (...args) => console.debug(`🟣 ${LOG_PREFIX} [DEBUG]`, ...args),
});

/**
 * Triggers a named debugger breakpoint with console output
 */
export const debugPoint = (name: DebugPoint, debug: boolean, logger: CitadelLogger): void => {
  if (debug) {
    logger.debug(name);
    debugger;
  }
};
