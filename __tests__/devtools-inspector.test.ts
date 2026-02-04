import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  createInspectorTree,
  getNodeState,
  setupInspector,
  refreshInspector,
} from '../src/devtools/inspector';
import { createRegistry, register } from '../src/navigationRegistry';
import type { NavigationRegistry } from '../src/types';
import { NavigationHooks } from '../src/types';
import type { DevToolsApi } from '../src/devtools/types';
import { DEVTOOLS_INSPECTOR_ID } from '../src/devtools/consts';
import { createMockLogger, createRegisteredOutpost, createAllowHandler } from './helpers/setup';

describe('DevTools Inspector', () => {
  let registry: NavigationRegistry;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    registry = createRegistry();
    mockLogger = createMockLogger();
  });

  describe('createInspectorTree', () => {
    it('should create empty tree when no outposts', () => {
      const tree = createInspectorTree(registry);

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('citadel-root');
      expect(tree[0].label).toBe('Outposts');
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children![0].label).toBe('Global (0)');
      expect(tree[0].children![1].label).toBe('Route (0)');
    });

    it('should include global outposts in tree', () => {
      register(
        registry,
        'global',
        createRegisteredOutpost({ name: 'auth', handler: createAllowHandler(), priority: 10 }),
        100,
        mockLogger,
      );
      register(
        registry,
        'global',
        createRegisteredOutpost({ name: 'logger', handler: createAllowHandler(), priority: 20 }),
        100,
        mockLogger,
      );

      const tree = createInspectorTree(registry);
      const globalNode = tree[0].children![0];

      expect(globalNode.label).toBe('Global (2)');
      expect(globalNode.children).toHaveLength(2);
      expect(globalNode.children![0].label).toBe('auth');
      expect(globalNode.children![1].label).toBe('logger');
    });

    it('should include route outposts in tree', () => {
      register(
        registry,
        'route',
        createRegisteredOutpost({ name: 'admin-only', handler: createAllowHandler() }),
        100,
        mockLogger,
      );

      const tree = createInspectorTree(registry);
      const routeNode = tree[0].children![1];

      expect(routeNode.label).toBe('Route (1)');
      expect(routeNode.children).toHaveLength(1);
      expect(routeNode.children![0].label).toBe('admin-only');
    });

    it('should add priority tag to outpost nodes', () => {
      register(
        registry,
        'global',
        createRegisteredOutpost({ name: 'auth', handler: createAllowHandler(), priority: 50 }),
        100,
        mockLogger,
      );

      const tree = createInspectorTree(registry);
      const outpostNode = tree[0].children![0].children![0];

      expect(outpostNode.tags).toBeDefined();
      expect(outpostNode.tags!.some((tag) => tag.label.includes('priority: 50'))).toBe(true);
    });

    it('should add hooks tag to outpost nodes', () => {
      register(
        registry,
        'global',
        createRegisteredOutpost({
          name: 'multi-hook',
          handler: createAllowHandler(),
          hooks: [NavigationHooks.BEFORE_EACH, NavigationHooks.BEFORE_RESOLVE],
        }),
        100,
        mockLogger,
      );

      const tree = createInspectorTree(registry);
      const outpostNode = tree[0].children![0].children![0];

      expect(outpostNode.tags!.some((tag) => tag.label.includes('2 hooks'))).toBe(true);
    });

    it('should add lazy tag for lazy outposts', () => {
      register(
        registry,
        'global',
        createRegisteredOutpost({ name: 'lazy-auth', handler: createAllowHandler(), lazy: true }),
        100,
        mockLogger,
      );

      const tree = createInspectorTree(registry);
      const outpostNode = tree[0].children![0].children![0];

      expect(outpostNode.tags!.some((tag) => tag.label === 'lazy')).toBe(true);
    });
  });

  describe('getNodeState', () => {
    it('should return null for non-outpost nodes', () => {
      const state = getNodeState('citadel-root', registry);
      expect(state).toBeNull();
    });

    it('should return null for invalid node id', () => {
      const state = getNodeState('invalid-id', registry);
      expect(state).toBeNull();
    });

    it('should return state for global outpost node', () => {
      register(
        registry,
        'global',
        createRegisteredOutpost({
          name: 'auth',
          handler: createAllowHandler(),
          priority: 10,
          hooks: [NavigationHooks.BEFORE_EACH],
          timeout: 5000,
        }),
        100,
        mockLogger,
      );

      const state = getNodeState('outpost-global-auth', registry);

      expect(state).not.toBeNull();
      expect(state!['Outpost Details']).toBeDefined();

      const details = state!['Outpost Details'];
      expect(details.find((d) => d.key === 'name')?.value).toBe('auth');
      expect(details.find((d) => d.key === 'scope')?.value).toBe('global');
      expect(details.find((d) => d.key === 'priority')?.value).toBe(10);
      expect(details.find((d) => d.key === 'timeout')?.value).toBe(5000);
    });

    it('should return state for route outpost node', () => {
      register(
        registry,
        'route',
        createRegisteredOutpost({ name: 'admin-only', handler: createAllowHandler() }),
        100,
        mockLogger,
      );

      const state = getNodeState('outpost-route-admin-only', registry);

      expect(state).not.toBeNull();
      const details = state!['Outpost Details'];
      expect(details.find((d) => d.key === 'scope')?.value).toBe('route');
    });

    it('should return null for non-existent outpost', () => {
      const state = getNodeState('outpost-global-nonexistent', registry);
      expect(state).toBeNull();
    });

    it('should show "none (uses default)" for undefined timeout', () => {
      register(
        registry,
        'global',
        createRegisteredOutpost({ name: 'no-timeout', handler: createAllowHandler() }),
        100,
        mockLogger,
      );

      const state = getNodeState('outpost-global-no-timeout', registry);
      const details = state!['Outpost Details'];

      expect(details.find((d) => d.key === 'timeout')?.value).toBe('none (uses default)');
    });
  });

  describe('setupInspector', () => {
    it('should add inspector to DevTools API', () => {
      const mockApi: DevToolsApi = {
        addInspector: vi.fn(),
        on: {
          getInspectorTree: vi.fn(),
          getInspectorState: vi.fn(),
          setPluginSettings: vi.fn(),
        },
        sendInspectorTree: vi.fn(),
        sendInspectorState: vi.fn(),
      };

      setupInspector(mockApi, registry, mockLogger);

      expect(mockApi.addInspector).toHaveBeenCalledWith(
        expect.objectContaining({
          id: DEVTOOLS_INSPECTOR_ID,
          label: expect.any(String),
          icon: expect.any(String),
        }),
      );
    });

    it('should register getInspectorTree callback', () => {
      const mockApi: DevToolsApi = {
        addInspector: vi.fn(),
        on: {
          getInspectorTree: vi.fn(),
          getInspectorState: vi.fn(),
          setPluginSettings: vi.fn(),
        },
        sendInspectorTree: vi.fn(),
        sendInspectorState: vi.fn(),
      };

      setupInspector(mockApi, registry, mockLogger);

      expect(mockApi.on.getInspectorTree).toHaveBeenCalled();
    });

    it('should register getInspectorState callback', () => {
      const mockApi: DevToolsApi = {
        addInspector: vi.fn(),
        on: {
          getInspectorTree: vi.fn(),
          getInspectorState: vi.fn(),
          setPluginSettings: vi.fn(),
        },
        sendInspectorTree: vi.fn(),
        sendInspectorState: vi.fn(),
      };

      setupInspector(mockApi, registry, mockLogger);

      expect(mockApi.on.getInspectorState).toHaveBeenCalled();
    });

    it('should populate rootNodes on getInspectorTree callback', () => {
      let treeCallback: ((payload: { inspectorId: string; rootNodes: unknown[] }) => void) | null =
        null;

      const mockApi: DevToolsApi = {
        addInspector: vi.fn(),
        on: {
          getInspectorTree: vi.fn((cb) => {
            treeCallback = cb;
          }),
          getInspectorState: vi.fn(),
          setPluginSettings: vi.fn(),
        },
        sendInspectorTree: vi.fn(),
        sendInspectorState: vi.fn(),
      };

      register(
        registry,
        'global',
        createRegisteredOutpost({ name: 'test-outpost', handler: createAllowHandler() }),
        100,
        mockLogger,
      );

      setupInspector(mockApi, registry, mockLogger);

      const payload = { inspectorId: DEVTOOLS_INSPECTOR_ID, rootNodes: [] as unknown[] };
      treeCallback!(payload);

      expect(payload.rootNodes).toHaveLength(1);
      expect(payload.rootNodes[0]).toMatchObject({ id: 'citadel-root' });
    });

    it('should ignore getInspectorTree for other inspectors', () => {
      let treeCallback: ((payload: { inspectorId: string; rootNodes: unknown[] }) => void) | null =
        null;

      const mockApi: DevToolsApi = {
        addInspector: vi.fn(),
        on: {
          getInspectorTree: vi.fn((cb) => {
            treeCallback = cb;
          }),
          getInspectorState: vi.fn(),
          setPluginSettings: vi.fn(),
        },
        sendInspectorTree: vi.fn(),
        sendInspectorState: vi.fn(),
      };

      setupInspector(mockApi, registry, mockLogger);

      const payload = { inspectorId: 'other-inspector', rootNodes: [] as unknown[] };
      treeCallback!(payload);

      expect(payload.rootNodes).toHaveLength(0);
    });

    it('should populate state on getInspectorState callback', () => {
      let stateCallback:
        | ((payload: { inspectorId: string; nodeId: string; state: unknown }) => void)
        | null = null;

      const mockApi: DevToolsApi = {
        addInspector: vi.fn(),
        on: {
          getInspectorTree: vi.fn(),
          getInspectorState: vi.fn((cb) => {
            stateCallback = cb;
          }),
          setPluginSettings: vi.fn(),
        },
        sendInspectorTree: vi.fn(),
        sendInspectorState: vi.fn(),
      };

      register(
        registry,
        'global',
        createRegisteredOutpost({ name: 'test-outpost', handler: createAllowHandler() }),
        100,
        mockLogger,
      );

      setupInspector(mockApi, registry, mockLogger);

      const payload = {
        inspectorId: DEVTOOLS_INSPECTOR_ID,
        nodeId: 'outpost-global-test-outpost',
        state: null as unknown,
      };
      stateCallback!(payload);

      expect(payload.state).not.toBeNull();
      expect(payload.state).toHaveProperty('Outpost Details');
    });
  });

  describe('refreshInspector', () => {
    it('should call sendInspectorTree and sendInspectorState', () => {
      const mockApi: DevToolsApi = {
        addInspector: vi.fn(),
        on: {
          getInspectorTree: vi.fn(),
          getInspectorState: vi.fn(),
          setPluginSettings: vi.fn(),
        },
        sendInspectorTree: vi.fn(),
        sendInspectorState: vi.fn(),
      };

      refreshInspector(mockApi);

      expect(mockApi.sendInspectorTree).toHaveBeenCalledWith(DEVTOOLS_INSPECTOR_ID);
      expect(mockApi.sendInspectorState).toHaveBeenCalledWith(DEVTOOLS_INSPECTOR_ID);
    });
  });
});
