import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {
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
  actions: {
    getFields: async (props) => {
      const { model, fields, attributes } = props.input

      props.logger
        .forBot()
        .info(`getFields called with model=${model}, fields=${fields}, attributes=${attributes}`)

      return {}
    },
  },
  channels: {},
  handler: async () => {},
})
