import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import axios from 'axios'

interface LoopsApiResponse {
  success: boolean
}

interface LoopsApiError {
  success: boolean
  path?: string
  message?: string
  error?: object
}

export default new bp.Integration({
  register: async (props) => {
    /**
     * This is called when an integration configuration is saved.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
    try {
      const response = await axios.get('https://app.loops.so/api/v1/api-key', {
        headers: {
          Authorization: `Bearer ${props.ctx.configuration.apiKey}`,
        },
      })
    }
    catch (error) {
      if (axios.isAxiosError<LoopsApiError>(error)) {
        if (!error.response) {
          throw new sdk.RuntimeError('A network error occurred when trying to validate the API key.')
        }
        
        if (error.response.status === 401) {
          throw new sdk.RuntimeError('Invalid or missing API key.')
        }

        throw new sdk.RuntimeError('An unexpected error occurred when trying to validate the API key.')
      }
    }
  },
  unregister: async () => {
    /**
     * This is called when a bot removes the integration.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
  },
  actions: {
    sendTransactionalEmail: async (props) => {
      const logger = props.logger.forBot()

      const {
        input: { email, transactionalId, dataVariables, addToAudience, idempotencyKey },
        ctx: {
          configuration: { apiKey },
        },
      } = props

      logger.info('This is the data variables:', { dataVariables, type: typeof dataVariables })

      // Parse { key, value } array to object with { key: value }
      const transformedDataVariables = dataVariables?.reduce((acc: Record<string, string>, item) => {
        acc[item.key] = item.value
        return acc
      }, {})

      logger.info('This is the transformed data variables:', {
        transformedDataVariables,
        type: typeof transformedDataVariables,
      })

      const requestBody = {
        email,
        transactionalId,
        ...(dataVariables.length > 0 && { dataVariables: transformedDataVariables }),
        ...(addToAudience && { addToAudience }),
        ...(idempotencyKey && { idempotencyKey }),
      }

      logger.info('This is the request body:', { requestBody, type: typeof requestBody })

      try {
        const response = await axios.post<LoopsApiResponse>('https://app.loops.so/api/v1/transactional', requestBody, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        })

        return {
          success: response.data.success,
        }
      } catch (error) {
        if (axios.isAxiosError<LoopsApiError>(error)) {
          if (!error.response) {
            logger.error('A network error occurred when calling the Loops API:', error)
            return {
              success: false,
              message: error.message,
            }
          }

          logger.error('An HTTP error occurred when calling the Loops API:', {
            code: error.response.status,
            ...error.response.data,
          })
          return {
            success: error.response.data.success,
            path: error.response.data.path,
            message: error.response.data.message,
            error: error.response.data.error,
          }
        }

        logger.error('An unexpected error occurred when calling the Loops API:', error)
        throw new sdk.RuntimeError(
          'An unexpected error occurred when calling the Loops API, see logs for more information.'
        )
      }
    },
  },
  channels: {},
  handler: async () => {},
})
