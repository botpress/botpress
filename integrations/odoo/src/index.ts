import actions from './odoo-client/actions/implementations'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async (props) => {
    props.logger
      .forBot()
      .info(
        `register called with url=${props.ctx.configuration.url}, database=${props.ctx.configuration.database}, apiKey=${props.ctx.configuration.apiKey}`
      )

    /**
     * This is called when an integration configuration is saved.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
    // throw new sdk.RuntimeError('Invalid configuration') // replace this with your own validation logic
  },
  unregister: async () => {
    /**
     * This is called when a bot removes the integration.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
    // throw new sdk.RuntimeError('Invalid configuration') // replace this with your own validation logic
  },
  actions,
  channels: {},
  handler: async () => {},
})
