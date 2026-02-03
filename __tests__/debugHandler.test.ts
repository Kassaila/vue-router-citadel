import { describe, it, expect, vi, beforeEach } from 'vitest';

import { debugPoint, createDefaultDebugHandler } from '../src/helpers';
import { DebugPoints } from '../src/types';
import type { CitadelLogger, DebugHandler } from '../src/types';

describe('debugHandler', () => {
  let mockLogger: CitadelLogger;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };
  });

  describe('debugPoint', () => {
    it('should call debugHandler when debug is true', () => {
      const mockDebugHandler = vi.fn();

      debugPoint(DebugPoints.NAVIGATION_START, true, mockLogger, mockDebugHandler);

      expect(mockDebugHandler).toHaveBeenCalledWith(DebugPoints.NAVIGATION_START);
      expect(mockDebugHandler).toHaveBeenCalledTimes(1);
    });

    it('should NOT call debugHandler when debug is false', () => {
      const mockDebugHandler = vi.fn();

      debugPoint(DebugPoints.NAVIGATION_START, false, mockLogger, mockDebugHandler);

      expect(mockDebugHandler).not.toHaveBeenCalled();
    });

    it('should call logger.debug when debug is true', () => {
      const mockDebugHandler = vi.fn();

      debugPoint(DebugPoints.BEFORE_OUTPOST, true, mockLogger, mockDebugHandler);

      expect(mockLogger.debug).toHaveBeenCalledWith(DebugPoints.BEFORE_OUTPOST);
    });

    it('should NOT call logger.debug when debug is false', () => {
      const mockDebugHandler = vi.fn();

      debugPoint(DebugPoints.BEFORE_OUTPOST, false, mockLogger, mockDebugHandler);

      expect(mockLogger.debug).not.toHaveBeenCalled();
    });

    it('should work without debugHandler (optional)', () => {
      // Should not throw
      expect(() => {
        debugPoint(DebugPoints.NAVIGATION_START, true, mockLogger);
      }).not.toThrow();

      expect(mockLogger.debug).toHaveBeenCalledWith(DebugPoints.NAVIGATION_START);
    });

    it('should pass correct debug point name to handler', () => {
      const mockDebugHandler = vi.fn();
      const debugPoints = [
        DebugPoints.NAVIGATION_START,
        DebugPoints.BEFORE_OUTPOST,
        DebugPoints.PATROL_STOPPED,
        DebugPoints.ERROR_CAUGHT,
        DebugPoints.TIMEOUT,
      ];

      for (const point of debugPoints) {
        debugPoint(point, true, mockLogger, mockDebugHandler);
      }

      expect(mockDebugHandler).toHaveBeenCalledTimes(debugPoints.length);
      for (const point of debugPoints) {
        expect(mockDebugHandler).toHaveBeenCalledWith(point);
      }
    });
  });

  describe('createDefaultDebugHandler', () => {
    it('should return a function', () => {
      const handler = createDefaultDebugHandler();

      expect(typeof handler).toBe('function');
    });

    it('should be callable with debug point name', () => {
      const handler = createDefaultDebugHandler();

      // Should not throw (debugger statement will be ignored in test environment)
      expect(() => {
        handler(DebugPoints.NAVIGATION_START);
      }).not.toThrow();
    });
  });

  describe('custom debugHandler integration', () => {
    it('should use custom debugHandler instead of default', () => {
      const customHandler = vi.fn();
      const defaultHandler = createDefaultDebugHandler();

      // Custom handler should be called
      debugPoint(DebugPoints.NAVIGATION_START, true, mockLogger, customHandler);
      expect(customHandler).toHaveBeenCalledWith(DebugPoints.NAVIGATION_START);

      // Default handler is separate
      expect(typeof defaultHandler).toBe('function');
    });

    it('should allow debugHandler to do custom actions', () => {
      const traces: string[] = [];
      const customHandler: DebugHandler = (name) => {
        traces.push(`trace: ${name}`);
      };

      debugPoint(DebugPoints.NAVIGATION_START, true, mockLogger, customHandler);
      debugPoint(DebugPoints.BEFORE_OUTPOST, true, mockLogger, customHandler);

      expect(traces).toEqual(['trace: navigation-start', 'trace: before-outpost']);
    });
  });
});
