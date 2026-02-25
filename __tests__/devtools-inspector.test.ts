import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Router } from 'vue-router';

import {
  createInspectorTree,
  createRouteAssignmentsNode,
  createCurrentRouteNode,
  getNodeState,
  setupInspector,
  refreshInspector,
} from '../src/devtools/inspector';
import { createRegistry, register } from '../src/navigationRegistry';
import type { NavigationRegistry } from '../src/types';
import { NavigationHooks } from '../src/types';
import type { DevToolsApi } from '../src/devtools/types';
import { DEVTOOLS_INSPECTOR_ID } from '../src/devtools/consts';
import {
  createMockRouter,
  createMockLogger,
  createRegisteredOutpost,
  createAllowHandler,
} from './helpers/setup';

const createMockApi = (): DevToolsApi => ({
  addInspector: vi.fn(),
  on: {
    getInspectorTree: vi.fn(),
    getInspectorState: vi.fn(),
    setPluginSettings: vi.fn(),
  },
  sendInspectorTree: vi.fn(),
  sendInspectorState: vi.fn(),
});

const createRouterWithOutposts = () =>
  createMockRouter([
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: { template: '<div>Dashboard</div>' },
      meta: { outposts: ['premium'] },
    },
    {
      path: '/admin',
      name: 'admin',
      component: { template: '<div>Admin</div>' },
      meta: { outposts: ['admin-only', 'audit-log'] },
    },
    { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
  ]);

describe('DevTools Inspector', () => {
  let registry: NavigationRegistry;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    registry = createRegistry();
    mockLogger = createMockLogger();
  });

  describe('createInspectorTree', () => {
    it('should create tree with global and route sections', () => {
      const tree = createInspectorTree(registry);

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('citadel-root');
      expect(tree[0].children![0].label).toBe('Global (0)');
      expect(tree[0].children![1].label).toBe('Route (0)');
    });

    it('should include outposts sorted by priority with tags', () => {
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
        createRegisteredOutpost({
          name: 'lazy-logger',
          handler: createAllowHandler(),
          priority: 20,
          lazy: true,
          hooks: [NavigationHooks.BEFORE_EACH, NavigationHooks.BEFORE_RESOLVE],
        }),
        100,
        mockLogger,
      );

      const tree = createInspectorTree(registry);
      const globalNode = tree[0].children![0];

      expect(globalNode.label).toBe('Global (2)');
      expect(globalNode.children![0].label).toBe('auth');
      expect(globalNode.children![0].tags!.some((t) => t.label.includes('priority: 10'))).toBe(
        true,
      );
      expect(globalNode.children![1].label).toBe('lazy-logger');
      expect(globalNode.children![1].tags!.some((t) => t.label === 'lazy')).toBe(true);
      expect(globalNode.children![1].tags!.some((t) => t.label.includes('2 hooks'))).toBe(true);
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
      expect(routeNode.children![0].label).toBe('admin-only');
    });

    it('should add route assignments and current route nodes when router provided', async () => {
      const router = createRouterWithOutposts();
      await router.push('/');
      await router.isReady();

      const tree = createInspectorTree(registry, router);

      expect(tree).toHaveLength(3);
      expect(tree[1].id).toBe('citadel-route-assignments');
      expect(tree[2].id).toBe('citadel-current-route');
    });
  });

  describe('createRouteAssignmentsNode', () => {
    it('should show only routes with outposts, using route name as label', async () => {
      const router = createRouterWithOutposts();
      await router.push('/');
      await router.isReady();

      const node = createRouteAssignmentsNode(router);

      expect(node.label).toBe('Route Assignments (2)');
      const labels = node.children!.map((c) => c.label);
      expect(labels).toContain('dashboard');
      expect(labels).toContain('admin');
      expect(labels).not.toContain('home');
    });

    it('should show outpost count in tag', async () => {
      const router = createRouterWithOutposts();
      await router.push('/');
      await router.isReady();

      const node = createRouteAssignmentsNode(router);
      const adminNode = node.children!.find((c) => c.label === 'admin');

      expect(adminNode!.tags!.some((tag) => tag.label === '2 outposts')).toBe(true);
    });

    it('should use path as label for unnamed routes', async () => {
      const router = createMockRouter([
        { path: '/', component: { template: '<div>Home</div>' } },
        {
          path: '/unnamed',
          component: { template: '<div>Unnamed</div>' },
          meta: { outposts: ['test'] },
        },
      ]);
      await router.push('/');
      await router.isReady();

      const node = createRouteAssignmentsNode(router);

      expect(node.children![0].label).toBe('/unnamed');
    });

    it('should show empty list when no routes have outposts', async () => {
      const router = createMockRouter();
      await router.push('/');
      await router.isReady();

      const node = createRouteAssignmentsNode(router);

      expect(node.label).toBe('Route Assignments (0)');
      expect(node.children).toHaveLength(0);
    });
  });

  describe('createCurrentRouteNode', () => {
    it('should show global outposts first, then route outposts (patrol order)', async () => {
      const router = createRouterWithOutposts();
      await router.push('/dashboard');
      await router.isReady();

      register(
        registry,
        'global',
        createRegisteredOutpost({ name: 'auth', handler: createAllowHandler(), priority: 50 }),
        100,
        mockLogger,
      );
      register(
        registry,
        'global',
        createRegisteredOutpost({
          name: 'analytics',
          handler: createAllowHandler(),
          priority: 100,
        }),
        100,
        mockLogger,
      );
      register(
        registry,
        'route',
        createRegisteredOutpost({ name: 'premium', handler: createAllowHandler(), priority: 80 }),
        100,
        mockLogger,
      );

      const node = createCurrentRouteNode(registry, router);

      expect(node.label).toBe('Current Route: /dashboard (3)');
      expect(node.tags!.some((tag) => tag.label === 'active')).toBe(true);
      expect(node.children![0].label).toBe('auth');
      expect(node.children![0].tags!.some((t) => t.label === 'global')).toBe(true);
      expect(node.children![1].label).toBe('analytics');
      expect(node.children![2].label).toBe('premium');
      expect(node.children![2].tags!.some((t) => t.label === 'route')).toBe(true);
    });

    it('should only include route outposts referenced in current route meta', async () => {
      const router = createRouterWithOutposts();
      await router.push('/dashboard');
      await router.isReady();

      register(
        registry,
        'route',
        createRegisteredOutpost({ name: 'premium', handler: createAllowHandler() }),
        100,
        mockLogger,
      );
      register(
        registry,
        'route',
        createRegisteredOutpost({ name: 'admin-only', handler: createAllowHandler() }),
        100,
        mockLogger,
      );

      const node = createCurrentRouteNode(registry, router);
      const labels = node.children!.map((c) => c.label);

      expect(labels).toContain('premium');
      expect(labels).not.toContain('admin-only');
    });

    it('should show only global outposts when route has no meta.outposts', async () => {
      const router = createRouterWithOutposts();
      await router.push('/');
      await router.isReady();

      register(
        registry,
        'global',
        createRegisteredOutpost({ name: 'auth', handler: createAllowHandler() }),
        100,
        mockLogger,
      );
      register(
        registry,
        'route',
        createRegisteredOutpost({ name: 'premium', handler: createAllowHandler() }),
        100,
        mockLogger,
      );

      const node = createCurrentRouteNode(registry, router);

      expect(node.children).toHaveLength(1);
      expect(node.children![0].label).toBe('auth');
    });

    it('should show lazy tag on lazy outposts', async () => {
      const router = createRouterWithOutposts();
      await router.push('/dashboard');
      await router.isReady();

      register(
        registry,
        'route',
        createRegisteredOutpost({ name: 'premium', handler: createAllowHandler(), lazy: true }),
        100,
        mockLogger,
      );

      const node = createCurrentRouteNode(registry, router);

      expect(node.children![0].tags!.some((tag) => tag.label === 'lazy')).toBe(true);
    });
  });

  describe('getNodeState', () => {
    it('should return null for unknown node ids', () => {
      expect(getNodeState('citadel-root', registry)).toBeNull();
      expect(getNodeState('invalid-id', registry)).toBeNull();
      expect(getNodeState('outpost-global-nonexistent', registry)).toBeNull();
    });

    it('should return outpost details for outpost nodes', () => {
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
      const details = state!['Outpost Details'];

      expect(details.find((d) => d.key === 'name')?.value).toBe('auth');
      expect(details.find((d) => d.key === 'scope')?.value).toBe('global');
      expect(details.find((d) => d.key === 'priority')?.value).toBe(10);
      expect(details.find((d) => d.key === 'timeout')?.value).toBe(5000);
    });

    it('should return outpost details for route scope nodes', () => {
      register(
        registry,
        'route',
        createRegisteredOutpost({ name: 'admin-only', handler: createAllowHandler() }),
        100,
        mockLogger,
      );

      const state = getNodeState('outpost-route-admin-only', registry);
      const details = state!['Outpost Details'];

      expect(details.find((d) => d.key === 'scope')?.value).toBe('route');
      expect(details.find((d) => d.key === 'timeout')?.value).toBe('none (uses default)');
    });

    it('should return outpost details for current-route-outpost nodes', async () => {
      const router = createRouterWithOutposts();
      await router.push('/');
      await router.isReady();

      register(
        registry,
        'global',
        createRegisteredOutpost({ name: 'auth', handler: createAllowHandler(), priority: 10 }),
        100,
        mockLogger,
      );

      const state = getNodeState('current-route-outpost-global-auth', registry, router);
      const details = state!['Outpost Details'];

      expect(details.find((d) => d.key === 'name')?.value).toBe('auth');
      expect(details.find((d) => d.key === 'scope')?.value).toBe('global');
    });

    it('should return route details for route assignment nodes', async () => {
      const router = createRouterWithOutposts();
      await router.push('/');
      await router.isReady();

      const state = getNodeState('route-assignment-admin', registry, router);
      const details = state!['Route Details'];

      expect(details.find((d) => d.key === 'name')?.value).toBe('admin');
      expect(details.find((d) => d.key === 'path')?.value).toBe('/admin');
      expect(details.find((d) => d.key === 'outposts (own)')?.value).toEqual([
        'admin-only',
        'audit-log',
      ]);
      expect(details.find((d) => d.key === 'outposts (resolved)')?.value).toEqual([
        'admin-only',
        'audit-log',
      ]);
    });

    it('should return null for non-existent route assignment', async () => {
      const router = createRouterWithOutposts();
      await router.push('/');
      await router.isReady();

      expect(getNodeState('route-assignment-nonexistent', registry, router)).toBeNull();
    });
  });

  describe('setupInspector', () => {
    let mockRouter: Router;

    beforeEach(async () => {
      mockRouter = createMockRouter();
      await mockRouter.push('/');
      await mockRouter.isReady();
    });

    it('should register inspector, tree callback, state callback, and afterEach hook', () => {
      const mockApi = createMockApi();
      const afterEachSpy = vi.spyOn(mockRouter, 'afterEach');

      setupInspector(mockApi, registry, mockRouter, mockLogger);

      expect(mockApi.addInspector).toHaveBeenCalledWith(
        expect.objectContaining({ id: DEVTOOLS_INSPECTOR_ID }),
      );
      expect(mockApi.on.getInspectorTree).toHaveBeenCalled();
      expect(mockApi.on.getInspectorState).toHaveBeenCalled();
      expect(afterEachSpy).toHaveBeenCalled();
    });

    it('should populate rootNodes with all three sections on tree callback', () => {
      let treeCallback: ((payload: { inspectorId: string; rootNodes: unknown[] }) => void) | null =
        null;

      const mockApi = createMockApi();
      mockApi.on.getInspectorTree = vi.fn((cb) => {
        treeCallback = cb;
      });

      setupInspector(mockApi, registry, mockRouter, mockLogger);

      const payload = { inspectorId: DEVTOOLS_INSPECTOR_ID, rootNodes: [] as unknown[] };
      treeCallback!(payload);

      expect(payload.rootNodes).toHaveLength(3);
      expect(payload.rootNodes[0]).toMatchObject({ id: 'citadel-root' });
      expect(payload.rootNodes[1]).toMatchObject({ id: 'citadel-route-assignments' });
      expect(payload.rootNodes[2]).toMatchObject({ id: 'citadel-current-route' });
    });

    it('should ignore callbacks for other inspectors', () => {
      let treeCallback: ((payload: { inspectorId: string; rootNodes: unknown[] }) => void) | null =
        null;

      const mockApi = createMockApi();
      mockApi.on.getInspectorTree = vi.fn((cb) => {
        treeCallback = cb;
      });

      setupInspector(mockApi, registry, mockRouter, mockLogger);

      const payload = { inspectorId: 'other-inspector', rootNodes: [] as unknown[] };
      treeCallback!(payload);

      expect(payload.rootNodes).toHaveLength(0);
    });
  });

  describe('refreshInspector', () => {
    it('should call sendInspectorTree and sendInspectorState', () => {
      const mockApi = createMockApi();

      refreshInspector(mockApi);

      expect(mockApi.sendInspectorTree).toHaveBeenCalledWith(DEVTOOLS_INSPECTOR_ID);
      expect(mockApi.sendInspectorState).toHaveBeenCalledWith(DEVTOOLS_INSPECTOR_ID);
    });
  });
});
