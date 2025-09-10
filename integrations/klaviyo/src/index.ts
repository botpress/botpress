import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {
    /**
     * This is called when an integration configuration is saved.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
    throw new sdk.RuntimeError('Invalid configuration') // replace this with your own validation logic
  },
  unregister: async () => {
    /**
     * This is called when a bot removes the integration.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
    throw new sdk.RuntimeError('Invalid configuration') // replace this with your own validation logic
  },
  actions: {
    helloWorld: async (props) => {
      /**
       * This is called when a bot calls the action `helloWorld`.
       */
      props.logger.forBot().info('Hello World!') // this log will be visible by the bots that use this integration

      let { name } = props.input
      name = name || 'World'
      return { message: `Hello "${name}"! Nice to meet you ;)` }
    },
  },
  channels: {},
  handler: async () => {},
})
