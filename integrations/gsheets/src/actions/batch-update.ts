import { batchUpdateInputSchema } from 'src/misc/custom-schemas'
import type { Implementation } from '../misc/types'
import { getClient } from '../utils'

export const batchUpdate: Implementation['actions']['batchUpdate'] = async ({
  ctx,
  input,
  logger,
}) => {
  const validatedInput = batchUpdateInputSchema.parse(input)
  const GoogleSheetsClient = getClient(ctx.configuration)
  let response

  try {
    response = await GoogleSheetsClient.batchUpdate(
      JSON.parse(validatedInput.requests)
    )
    logger
      .forBot()
      .info(`Successful - Batch Update - ${response?.spreadsheetId}`)
  } catch (error) {
    response = {}
    logger.forBot().debug(`'Batch Update' exception ${error}`)
  }

  return response
}
