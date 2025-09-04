import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import axios from 'axios'

interface LoopsApiResponse {
  success: boolean;
  path?: string;
  message?: string;
  error?: object;
}

export default new bp.Integration({
  register: async () => {
    /**
     * This is called when an integration configuration is saved.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
  },
  unregister: async () => {
    /**
     * This is called when a bot removes the integration.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
  },
  actions: {
    sendTransactionalEmail: async (props) => {
      const { 
        input: {
          email, 
          transactionalId, 
          dataVariables,
          addToAudience,
          idempotencyKey
        },
        ctx: {
          configuration: {
            apiKey
          }
        }
      } = props;

      // Parse { key, value } array to object with { key: value }
      const transformedDataVariables = dataVariables?.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string>);

      const response = await axios.post<LoopsApiResponse>("https://api.loops.so/api/v1/transactional", {
        email,
        transactionalId,
        ...(transformedDataVariables && { dataVariables: transformedDataVariables }),
        ...(addToAudience && { addToAudience }),
        ...(idempotencyKey && { idempotencyKey })
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      })

      return {
        success: response.data.success
      }
    }
  },
  channels: {},
  handler: async () => {},
})
