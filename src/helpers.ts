import { LOG_PREFIX } from './consts';
import type { DebugPoint } from './types';

/**
 * Triggers a named debugger breakpoint with console output
 */
export const debugPoint = (name: DebugPoint, debug: boolean): void => {
  if (debug) {
    console.debug(`🟣 ${LOG_PREFIX} [DEBUG] ${name}`);
    debugger;
  }
};
