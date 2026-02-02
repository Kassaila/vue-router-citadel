import type { App } from 'vue';
import type { Router } from 'vue-router';
import { setupDevToolsPlugin } from '@vue/devtools-api';

import type { NavigationRegistry, CitadelLogger } from '../types';
import { DebugPoints } from '../types';
import { debugPoint } from '../helpers';
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
 * @param debug - Enable debug breakpoints
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
  debug = false,
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
      setupInspector(api, registry, logger, debug);
    },
  );
};

/**
 * Auto-setup DevTools by hooking into router.install()
 *
 * IMPORTANT: This only works if citadel is created BEFORE app.use(router).
 * If citadel is created after, use citadel.initDevtools(app) instead.
 *
 * @param router - Vue Router instance
 * @param registry - Navigation registry
 * @param logger - Citadel logger
 * @param debug - Enable debug breakpoints
 *
 * @internal
 */
export const autoSetupDevtools = (
  router: Router,
  registry: NavigationRegistry,
  logger: CitadelLogger,
  debug = false,
): void => {
  const originalInstall = router.install.bind(router);

  router.install = (app: App) => {
    // Restore original install to avoid multiple intercepts
    router.install = originalInstall;

    // Call original install
    originalInstall(app);

    // Now setup DevTools with the app
    setupDevtools(app, registry, logger, debug);
    debugPoint(DebugPoints.DEVTOOLS_INIT, debug, logger);
  };
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
