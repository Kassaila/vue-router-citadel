import { describe, it, expect, beforeEach } from 'vitest';

import {
  createRegistry,
  register,
  unregister,
  getRegisteredNames,
} from '../src/navigationRegistry';
import type { NavigationRegistry } from '../src/types';
import { createMockLogger, createAllowHandler, createRegisteredOutpost } from './helpers/setup';

describe('navigationRegistry', () => {
  let registry: NavigationRegistry;
  const mockLogger = createMockLogger();

  beforeEach(() => {
    registry = createRegistry();
    mockLogger.clear();
  });

  describe('createRegistry', () => {
    it('returns empty registry structure', () => {
      expect(registry.global).toBeInstanceOf(Map);
      expect(registry.route).toBeInstanceOf(Map);
      expect(registry.global.size).toBe(0);
      expect(registry.route.size).toBe(0);
      expect(registry.globalSorted).toEqual([]);
      expect(registry.routeSorted).toEqual([]);
    });
  });

  describe('register', () => {
    it('adds outpost to global registry', () => {
      register(
        registry,
        'global',
        createRegisteredOutpost({ name: 'auth', handler: createAllowHandler() }),
        100,
        mockLogger,
      );

      expect(registry.global.has('auth')).toBe(true);
      expect(registry.global.get('auth')?.name).toBe('auth');
    });

    it('adds outpost to route registry', () => {
      register(
        registry,
        'route',
        createRegisteredOutpost({ name: 'admin-only', handler: createAllowHandler() }),
        100,
        mockLogger,
      );

      expect(registry.route.has('admin-only')).toBe(true);
      expect(registry.route.get('admin-only')?.name).toBe('admin-only');
    });

    it('warns on duplicate and replaces existing', () => {
      const outpost1 = createRegisteredOutpost({ name: 'auth', handler: createAllowHandler() });
      const outpost2 = createRegisteredOutpost({ name: 'auth', handler: createAllowHandler() });

      register(registry, 'global', outpost1, 100, mockLogger);
      register(registry, 'global', outpost2, 100, mockLogger);

      expect(registry.global.get('auth')?.getHandler).toBe(outpost2.getHandler);
      expect(
        mockLogger.calls.some(
          (c) => c.level === 'warn' && (c.args[0] as string).includes('already exists'),
        ),
      ).toBe(true);
    });

    it('updates sorted array by priority', () => {
      register(
        registry,
        'global',
        createRegisteredOutpost({ name: 'low', handler: createAllowHandler(), priority: 50 }),
        100,
        mockLogger,
      );
      register(
        registry,
        'global',
        createRegisteredOutpost({ name: 'high', handler: createAllowHandler(), priority: 10 }),
        100,
        mockLogger,
      );
      register(
        registry,
        'global',
        createRegisteredOutpost({ name: 'default', handler: createAllowHandler() }),
        100,
        mockLogger,
      );

      expect(registry.globalSorted).toEqual(['high', 'low', 'default']);
    });

    it('uses defaultPriority for outposts without priority', () => {
      register(
        registry,
        'global',
        createRegisteredOutpost({ name: 'explicit', handler: createAllowHandler(), priority: 50 }),
        100,
        mockLogger,
      );
      register(
        registry,
        'global',
        createRegisteredOutpost({ name: 'default', handler: createAllowHandler() }),
        100,
        mockLogger,
      );

      /**
       * explicit (50) comes before default (100)
       */
      expect(registry.globalSorted).toEqual(['explicit', 'default']);
    });
  });

  describe('unregister', () => {
    it('removes outpost and returns true', () => {
      register(
        registry,
        'global',
        createRegisteredOutpost({ name: 'auth', handler: createAllowHandler() }),
        100,
        mockLogger,
      );

      const result = unregister(registry, 'global', 'auth', 100);

      expect(result).toBe(true);
      expect(registry.global.has('auth')).toBe(false);
    });

    it('returns false if outpost not found', () => {
      const result = unregister(registry, 'global', 'nonexistent', 100);

      expect(result).toBe(false);
    });

    it('updates sorted array after removal', () => {
      register(
        registry,
        'global',
        createRegisteredOutpost({ name: 'first', handler: createAllowHandler(), priority: 10 }),
        100,
        mockLogger,
      );
      register(
        registry,
        'global',
        createRegisteredOutpost({ name: 'second', handler: createAllowHandler(), priority: 20 }),
        100,
        mockLogger,
      );

      unregister(registry, 'global', 'first', 100);

      expect(registry.globalSorted).toEqual(['second']);
    });
  });

  describe('getRegisteredNames', () => {
    it('returns global outpost names', () => {
      register(
        registry,
        'global',
        createRegisteredOutpost({ name: 'auth', handler: createAllowHandler() }),
        100,
        mockLogger,
      );
      register(
        registry,
        'global',
        createRegisteredOutpost({ name: 'logger', handler: createAllowHandler() }),
        100,
        mockLogger,
      );

      const names = getRegisteredNames(registry, 'global');

      expect(names).toContain('auth');
      expect(names).toContain('logger');
      expect(names).toHaveLength(2);
    });

    it('returns route outpost names', () => {
      register(
        registry,
        'route',
        createRegisteredOutpost({ name: 'admin-only', handler: createAllowHandler() }),
        100,
        mockLogger,
      );

      const names = getRegisteredNames(registry, 'route');

      expect(names).toEqual(['admin-only']);
    });

    it('returns empty array when no outposts', () => {
      expect(getRegisteredNames(registry, 'global')).toEqual([]);
      expect(getRegisteredNames(registry, 'route')).toEqual([]);
    });
  });
});
