import type { App } from 'vue';
import { setupDevToolsPlugin } from '@vue/devtools-api';

import type { NavigationRegistry, CitadelLogger, DebugHandler } from '../types';
import { __DEV__ } from '../consts';
import type { DevToolsApi, CitadelRuntimeState, LogLevel } from './types';
import { DEVTOOLS_PLUGIN_ID, DEVTOOLS_PLUGIN_LABEL, DEVTOOLS_PLUGIN_ICON } from './consts';
import { setupInspector, refreshInspector } from './inspector';
import { initializeRuntimeState, updateRuntimeState, createSettingsDefinition } from './settings';

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
 * @param runtimeState - Mutable runtime state (log, debug)
 * @param optionLog - Original log option from citadel creation
 * @param optionDebug - Original debug option from citadel creation
 *
 * @internal
 */
export const setupDevtools = (
  app: App,
  registry: NavigationRegistry,
  logger: CitadelLogger,
  runtimeState: CitadelRuntimeState,
  optionLog?: boolean,
  optionDebug?: boolean,
  debugHandler?: DebugHandler,
): void => {
  // Initialize runtime state from localStorage → citadel options → defaults
  const initialState = initializeRuntimeState(optionLog, optionDebug, __DEV__);
  runtimeState.log = initialState.log;
  runtimeState.debug = initialState.debug;

  setupDevToolsPlugin(
    {
      id: DEVTOOLS_PLUGIN_ID,
      label: DEVTOOLS_PLUGIN_LABEL,
      packageName: 'vue-router-citadel',
      homepage: 'https://github.com/Kassaila/vue-router-citadel',
      enableEarlyProxy: true,
      app,
      settings: createSettingsDefinition(runtimeState),
    },
    (api) => {
      devtoolsApi = api;

      // Listen for settings changes from DevTools UI
      api.on.setPluginSettings((payload) => {
        if (payload.key === 'logLevel') {
          updateRuntimeState(runtimeState, payload.newValue as LogLevel);
        }
      });

      setupInspector(api, registry, logger, runtimeState.debug, debugHandler);
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
