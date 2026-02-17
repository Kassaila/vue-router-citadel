import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router';
import type {
  CitadelLogger,
  NavigationOutpostHandler,
  RegisteredNavigationOutpost,
  NavigationHook,
} from '../../src/types';

/**
 * Creates a mock router for testing
 */
export const createMockRouter = (routes: RouteRecordRaw[] = []) => {
  const defaultRoutes: RouteRecordRaw[] = [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
    { path: '/dashboard', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
    { path: '/admin', name: 'admin', component: { template: '<div>Admin</div>' } },
    { path: '/error', name: 'error', component: { template: '<div>Error</div>' } },
  ];

  return createRouter({
    history: createMemoryHistory(),
    routes: routes.length > 0 ? routes : defaultRoutes,
  });
};

/**
 * Creates a mock logger that captures log calls
 */
export const createMockLogger = (): CitadelLogger & {
  calls: { level: string; args: unknown[] }[];
  clear: () => void;
} => {
  const calls: { level: string; args: unknown[] }[] = [];

  return {
    calls,
    clear: () => {
      calls.length = 0;
    },
    info: (...args) => {
      calls.push({ level: 'info', args });
    },
    warn: (...args) => {
      calls.push({ level: 'warn', args });
    },
    error: (...args) => {
      calls.push({ level: 'error', args });
    },
    debug: (...args) => {
      calls.push({ level: 'debug', args });
    },
  };
};

/**
 * Creates a simple ALLOW handler
 */
export const createAllowHandler = () => {
  return () => 'allow' as const;
};

/**
 * Creates a simple BLOCK handler
 */
export const createBlockHandler = () => {
  return () => 'block' as const;
};

/**
 * Creates a redirect handler
 */
export const createRedirectHandler = (to: string | { name: string }) => {
  return () => to;
};

/**
 * Creates a delayed handler for timeout testing
 */
export const createDelayedHandler = (ms: number, outcome: 'allow' | 'block' = 'allow') => {
  return () =>
    new Promise<'allow' | 'block'>((resolve) => {
      setTimeout(() => resolve(outcome), ms);
    });
};

/**
 * Creates an error-throwing handler
 */
export const createErrorHandler = (message: string) => {
  return () => {
    throw new Error(message);
  };
};

/**
 * Creates a RegisteredNavigationOutpost for testing
 */
export const createRegisteredOutpost = (options: {
  name: string;
  handler: NavigationOutpostHandler;
  priority?: number;
  hooks?: NavigationHook[];
  timeout?: number;
  lazy?: boolean;
}): RegisteredNavigationOutpost => {
  const { name, handler, priority, hooks, timeout, lazy = false } = options;
  return {
    name,
    priority,
    hooks,
    timeout,
    lazy,
    getHandler: () => Promise.resolve(handler),
  };
};

/**
 * Waits for a condition with timeout
 */
export const waitFor = async (
  condition: () => boolean,
  timeout = 1000,
  interval = 10,
): Promise<void> => {
  const start = Date.now();

  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('waitFor timeout');
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }
};
