import * as sdk from '@botpress/sdk'
import axios from 'axios'
import * as bp from '.botpress'

type LoopsApiResponse = {
  success: boolean
}

type LoopsApiError = {
  success: boolean
  path?: string
  message?: string
  error?: object
}

export default new bp.Integration({
  register: async (props) => {
    try {
      await axios.get('https://app.loops.so/api/v1/api-key', {
        headers: {
          Authorization: `Bearer ${props.ctx.configuration.apiKey}`,
        },
      })
    } catch (error) {
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
  unregister: async () => {},
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
        await axios.post<LoopsApiResponse>('https://app.loops.so/api/v1/transactional', requestBody, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        })

        return {};
      } catch (error) {
        if (axios.isAxiosError<LoopsApiError>(error)) {
          if (!error.response) {
            logger.error('A network error occurred when calling the Loops API:', error)
            throw new sdk.RuntimeError('A network error occurred when calling the Loops API.')
          }

          logger.error('An HTTP error occurred when calling the Loops API:', {
            code: error.response.status,
            ...error.response.data,
          })

          if (error.response.status === 409) {
            throw new sdk.RuntimeError('An idempotency key has been used in the previous 24 hours.')
          }

          throw new sdk.RuntimeError('An HTTP error occurred when calling the Loops API.')
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
