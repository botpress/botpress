import type { UnregisterFunction } from '../misc/types'

export const unregister: UnregisterFunction = async () => {
  /**
   * This is called when a bot removes the integration.
   * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
   */
}
