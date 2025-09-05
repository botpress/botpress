import { ActionHandlerProps } from '@botpress/sdk/dist/integration'
import { LoopsApi } from 'src/loops.api'
import { TIntegration } from '.botpress'
import { Input } from '.botpress/implementation/typings/actions/sendTransactionalEmail/input'

export async function sendTransactionalEmail(props: ActionHandlerProps<TIntegration, 'sendTransactionalEmail', Input>) {
  const logger = props.logger.forBot()

  const {
    input: { email, transactionalId, dataVariableEntries, addToAudience, idempotencyKey },
    ctx: {
      configuration: { apiKey },
    },
  } = props

  logger.info('This is the data variables:', { dataVariableEntries })

  const dataVariables = dataVariableEntries?.reduce((acc: Record<string, string>, item) => {
    acc[item.key] = item.value
    return acc
  }, {})

  logger.info('This is the parsed data variables for the API request:', { dataVariables })

  const requestBody = {
    email,
    transactionalId,
    addToAudience,
    idempotencyKey,
    dataVariables: Object.keys(dataVariables).length > 0 ? dataVariables : undefined,
  }

  logger.info('This is the request body:', { requestBody })

  const loops = new LoopsApi(apiKey, logger)
  return await loops.postTransactionalEmail(requestBody)
}
