import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import axios from 'axios'

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
    sendTransactionalEmail: async (props) => {
      const { 
        input: {
          email, 
          transactionalId, 
          dataVariables,
        },
        ctx: {
          configuration: {
            apiKey
          }
        }
      } = props;

      const response = await axios.post("https://api.loops.so/api/v1/transactional/send", {
        email,
        transactionalId,
        dataVariables
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      })

      return {
        success: response.status >= 200 && response.status < 300 // HTTP 2XX
      }
    }
  },
  channels: {},
  handler: async () => {},
})
