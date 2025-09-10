import { LoopsApi } from 'src/loops.api'
import * as bp from '.botpress'

export const sendTransactionalEmail: bp.IntegrationProps['actions']['sendTransactionalEmail'] = async (props) => {
  const logger = props.logger.forBot()

  const {
    input: { email, transactionalId, dataVariables: dataVariableEntries, addToAudience, idempotencyKey },
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
  return await loops.sendTransactionalEmail(requestBody)
}
