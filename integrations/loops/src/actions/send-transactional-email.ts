import { ActionHandlerProps } from '@botpress/sdk/dist/integration'
import { LoopsApi } from 'src/loops.api'
import { TIntegration } from '.botpress'
import { Input } from '.botpress/implementation/typings/actions/sendTransactionalEmail/input'

export async function sendTransactionalEmail(props: ActionHandlerProps<TIntegration, 'sendTransactionalEmail', Input>) {
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

  const loops = new LoopsApi(apiKey, logger)
  return await loops.postTransactionalEmail(requestBody)
}
