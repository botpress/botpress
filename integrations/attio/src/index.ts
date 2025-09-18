import * as sdk from '@botpress/sdk'
import actions from './actions'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async ({ ctx }) => {
    /**
     * This is called when an integration configuration is saved.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
    try {
      const accessToken = ctx.configuration.accessToken
      const response = await fetch('https://api.attio.com/v2/self', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (response.status !== 200) {
        throw new sdk.RuntimeError(response.status + ' - ' + response.statusText)
      }
    } catch (error: unknown) {
      throw new sdk.RuntimeError('Response - ' + error)
    }
  },
  unregister: async () => {},
  /**
   * This is called when a bot removes the integration.
   * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
   */
  actions,
  channels: {},
  handler: async () => {},
})
