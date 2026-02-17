import type { CitadelRuntimeState, DevToolsSettingsDefinition, LogLevel } from './types';
import { LOG_LEVELS } from './types';
import { SETTINGS_STORAGE_PREFIX, SETTINGS_KEY_LOG_LEVEL } from './consts';

/**
 * Gets log level from localStorage
 * Returns null if not found or localStorage is unavailable
 */
const getStoredLogLevel = (): LogLevel | null => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const value = localStorage.getItem(SETTINGS_STORAGE_PREFIX + SETTINGS_KEY_LOG_LEVEL);

    if (value === null) {
      return null;
    }

    /**
     * Validate stored value
     */
    if (value === LOG_LEVELS.OFF || value === LOG_LEVELS.LOG || value === LOG_LEVELS.DEBUG) {
      return value;
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Saves log level to localStorage
 */
const setStoredLogLevel = (value: LogLevel): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    localStorage.setItem(SETTINGS_STORAGE_PREFIX + SETTINGS_KEY_LOG_LEVEL, value);
  } catch {
    /**
     * Silently fail if localStorage is not available
     */
  }
};

/**
 * Converts log/debug options to LogLevel
 */
const optionsToLogLevel = (
  optionLog: boolean | undefined,
  optionDebug: boolean | undefined,
  defaultLog: boolean,
): LogLevel => {
  if (optionDebug) {
    return LOG_LEVELS.DEBUG;
  }

  const log = optionLog ?? defaultLog;

  return log ? LOG_LEVELS.LOG : LOG_LEVELS.OFF;
};

/**
 * Converts LogLevel to runtime state
 */
export const logLevelToState = (level: LogLevel): CitadelRuntimeState => {
  switch (level) {
    case LOG_LEVELS.OFF: {
      return { log: false, debug: false };
    }
    case LOG_LEVELS.LOG: {
      return { log: true, debug: false };
    }
    case LOG_LEVELS.DEBUG: {
      return { log: true, debug: true };
    }
  }
};

/**
 * Converts runtime state to LogLevel
 */
export const stateToLogLevel = (state: CitadelRuntimeState): LogLevel => {
  if (state.debug) {
    return LOG_LEVELS.DEBUG;
  }

  return state.log ? LOG_LEVELS.LOG : LOG_LEVELS.OFF;
};

/**
 * Initializes runtime state with priority:
 * localStorage → citadel options → defaults (__DEV__)
 *
 * @param optionLog - log value from citadel options
 * @param optionDebug - debug value from citadel options
 * @param defaultValue - default value for log (typically __DEV__)
 */
export const initializeRuntimeState = (
  optionLog: boolean | undefined,
  optionDebug: boolean | undefined,
  defaultValue: boolean,
): CitadelRuntimeState => {
  /**
   * Priority: localStorage → citadel options → defaults
   */
  const storedLevel = getStoredLogLevel();

  if (storedLevel !== null) {
    return logLevelToState(storedLevel);
  }

  const level = optionsToLogLevel(optionLog, optionDebug, defaultValue);

  return logLevelToState(level);
};

/**
 * Updates runtime state from DevTools settings change
 *
 * @param state - Current runtime state to mutate
 * @param value - New LogLevel value
 */
export const updateRuntimeState = (state: CitadelRuntimeState, value: LogLevel): void => {
  const newState = logLevelToState(value);

  state.log = newState.log;
  state.debug = newState.debug;
  setStoredLogLevel(value);
};

/**
 * Creates DevTools settings definition based on current state
 */
export const createSettingsDefinition = (
  state: CitadelRuntimeState,
): DevToolsSettingsDefinition => ({
  logLevel: {
    label: 'Log level',
    type: 'choice',
    defaultValue: stateToLogLevel(state),
    options: [
      { label: 'Off', value: LOG_LEVELS.OFF },
      { label: 'Log', value: LOG_LEVELS.LOG },
      { label: 'Log + Debug', value: LOG_LEVELS.DEBUG },
    ],
    component: 'button-group',
  },
});
