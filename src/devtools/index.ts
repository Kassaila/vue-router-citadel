import type { App } from 'vue';
import type { Router } from 'vue-router';
import { setupDevToolsPlugin } from '@vue/devtools-api';

import type { NavigationRegistry, CitadelLogger } from '../types';
import { DEVTOOLS_CONFIG, type DevToolsApi } from './types';
import { setupInspector, refreshInspector } from './inspector';

/**
 * Stored DevTools API reference for refresh operations
 */
let devtoolsApi: DevToolsApi | null = null;

/**
 * Sets up Vue DevTools integration for Navigation Citadel
 *
 * @param app - Vue application instance
 * @param registry - Navigation registry
 * @param logger - Citadel logger
 *
 * @example
 * ```typescript
 * import { setupDevtools } from 'vue-router-citadel';
 *
 * const app = createApp(App);
 * const citadel = createNavigationCitadel(router);
 *
 * // Manual setup (if auto-setup is not used)
 * setupDevtools(app, registry, logger);
 * ```
 */
export const setupDevtools = (
  app: App,
  registry: NavigationRegistry,
  logger: CitadelLogger,
): void => {
  setupDevToolsPlugin(
    {
      id: DEVTOOLS_CONFIG.PLUGIN_ID,
      label: DEVTOOLS_CONFIG.PLUGIN_LABEL,
      packageName: 'vue-router-citadel',
      homepage: 'https://github.com/Kassaila/vue-router-citadel',
      enableEarlyProxy: true,
      app,
    },
    (api) => {
      devtoolsApi = api;
      setupInspector(api, registry, logger);
    },
  );
};

/**
 * Auto-setup DevTools when router is ready
 *
 * @param router - Vue Router instance
 * @param registry - Navigation registry
 * @param logger - Citadel logger
 *
 * @internal
 */
export const autoSetupDevtools = (
  router: Router,
  registry: NavigationRegistry,
  logger: CitadelLogger,
): void => {
  router.isReady().then(() => {
    // Get app from router (available after router.install())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const app = (router as any).app as App | undefined;

    if (app) {
      setupDevtools(app, registry, logger);
      logger.debug('DevTools auto-initialized');
    } else {
      logger.debug('DevTools auto-setup skipped: app not available on router');
    }
  });
};

/**
 * Notifies DevTools to refresh the inspector
 * Call this after deploying or abandoning outposts
 *
 * @internal
 */
export const notifyDevtoolsRefresh = (): void => {
  if (devtoolsApi) {
    refreshInspector(devtoolsApi);
  }
};

/**
 * Clears DevTools API reference
 * Call this when destroying the citadel
 *
 * @internal
 */
export const clearDevtoolsApi = (): void => {
  devtoolsApi = null;
};
