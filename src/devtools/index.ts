import type { App } from 'vue';
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
 * @param debug - Enable debug breakpoints
 *
 * @internal
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
