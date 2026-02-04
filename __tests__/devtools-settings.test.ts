import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  initializeRuntimeState,
  updateRuntimeState,
  createSettingsDefinition,
  logLevelToState,
  stateToLogLevel,
} from '../src/devtools/settings';
import type { CitadelRuntimeState } from '../src/devtools/types';
import { LOG_LEVELS } from '../src/devtools/types';
import { SETTINGS_STORAGE_PREFIX, SETTINGS_KEY_LOG_LEVEL } from '../src/devtools/consts';

describe('DevTools Settings', () => {
  // Mock localStorage
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};

    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('logLevelToState', () => {
    it('should convert OFF to log:false, debug:false', () => {
      expect(logLevelToState(LOG_LEVELS.OFF)).toEqual({ log: false, debug: false });
    });

    it('should convert LOG to log:true, debug:false', () => {
      expect(logLevelToState(LOG_LEVELS.LOG)).toEqual({ log: true, debug: false });
    });

    it('should convert DEBUG to log:true, debug:true', () => {
      expect(logLevelToState(LOG_LEVELS.DEBUG)).toEqual({ log: true, debug: true });
    });
  });

  describe('stateToLogLevel', () => {
    it('should convert log:false, debug:false to OFF', () => {
      expect(stateToLogLevel({ log: false, debug: false })).toBe(LOG_LEVELS.OFF);
    });

    it('should convert log:true, debug:false to LOG', () => {
      expect(stateToLogLevel({ log: true, debug: false })).toBe(LOG_LEVELS.LOG);
    });

    it('should convert log:true, debug:true to DEBUG', () => {
      expect(stateToLogLevel({ log: true, debug: true })).toBe(LOG_LEVELS.DEBUG);
    });

    it('should convert log:false, debug:true to DEBUG (debug takes precedence)', () => {
      // Edge case: if somehow debug is true but log is false, debug wins
      expect(stateToLogLevel({ log: false, debug: true })).toBe(LOG_LEVELS.DEBUG);
    });
  });

  describe('initializeRuntimeState', () => {
    it('should use localStorage value when available', () => {
      mockStorage[SETTINGS_STORAGE_PREFIX + SETTINGS_KEY_LOG_LEVEL] = LOG_LEVELS.DEBUG;

      const state = initializeRuntimeState(false, false, false);

      expect(state.log).toBe(true);
      expect(state.debug).toBe(true);
    });

    it('should use citadel options when localStorage is empty', () => {
      const state = initializeRuntimeState(true, true, false);

      expect(state.log).toBe(true);
      expect(state.debug).toBe(true);
    });

    it('should use defaults when localStorage and options are empty', () => {
      const state = initializeRuntimeState(undefined, undefined, true);

      expect(state.log).toBe(true); // default value
      expect(state.debug).toBe(false);
    });

    it('should prioritize debug option over log option', () => {
      const state = initializeRuntimeState(false, true, false);

      expect(state.log).toBe(true); // debug forces log
      expect(state.debug).toBe(true);
    });

    it('should respect log=false when debug=false', () => {
      const state = initializeRuntimeState(false, false, false);

      expect(state.log).toBe(false);
      expect(state.debug).toBe(false);
    });

    it('should ignore invalid localStorage value', () => {
      mockStorage[SETTINGS_STORAGE_PREFIX + SETTINGS_KEY_LOG_LEVEL] = 'invalid';

      const state = initializeRuntimeState(true, false, false);

      expect(state.log).toBe(true);
      expect(state.debug).toBe(false);
    });
  });

  describe('updateRuntimeState', () => {
    it('should update state to OFF', () => {
      const state: CitadelRuntimeState = { log: true, debug: true };

      updateRuntimeState(state, LOG_LEVELS.OFF);

      expect(state.log).toBe(false);
      expect(state.debug).toBe(false);
      expect(mockStorage[SETTINGS_STORAGE_PREFIX + SETTINGS_KEY_LOG_LEVEL]).toBe(LOG_LEVELS.OFF);
    });

    it('should update state to LOG', () => {
      const state: CitadelRuntimeState = { log: false, debug: false };

      updateRuntimeState(state, LOG_LEVELS.LOG);

      expect(state.log).toBe(true);
      expect(state.debug).toBe(false);
      expect(mockStorage[SETTINGS_STORAGE_PREFIX + SETTINGS_KEY_LOG_LEVEL]).toBe(LOG_LEVELS.LOG);
    });

    it('should update state to DEBUG', () => {
      const state: CitadelRuntimeState = { log: false, debug: false };

      updateRuntimeState(state, LOG_LEVELS.DEBUG);

      expect(state.log).toBe(true);
      expect(state.debug).toBe(true);
      expect(mockStorage[SETTINGS_STORAGE_PREFIX + SETTINGS_KEY_LOG_LEVEL]).toBe(LOG_LEVELS.DEBUG);
    });
  });

  describe('createSettingsDefinition', () => {
    it('should create settings with current state as default', () => {
      const state: CitadelRuntimeState = { log: true, debug: false };
      const settings = createSettingsDefinition(state);

      expect(settings.logLevel.label).toBe('Log level');
      expect(settings.logLevel.type).toBe('choice');
      expect(settings.logLevel.defaultValue).toBe(LOG_LEVELS.LOG);
      expect(settings.logLevel.component).toBe('button-group');
      expect(settings.logLevel.options).toHaveLength(3);
    });

    it('should set default to OFF when log and debug are false', () => {
      const state: CitadelRuntimeState = { log: false, debug: false };
      const settings = createSettingsDefinition(state);

      expect(settings.logLevel.defaultValue).toBe(LOG_LEVELS.OFF);
    });

    it('should set default to DEBUG when debug is true', () => {
      const state: CitadelRuntimeState = { log: true, debug: true };
      const settings = createSettingsDefinition(state);

      expect(settings.logLevel.defaultValue).toBe(LOG_LEVELS.DEBUG);
    });
  });
});
