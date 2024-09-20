import { getTableRecordsInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'
import { getClient } from '../utils'

export const getTableRecords: IntegrationProps['actions']['getTableRecords'] = async ({ ctx, logger, input }) => {
  const validatedInput = getTableRecordsInputSchema.parse(input)
  const AirtableClient = getClient(ctx.configuration)
  try {
    const output = await AirtableClient.getTableRecords(validatedInput.tableIdOrName)
    const records = output.map((record) => {
      return {
        _rawJson: record.fields,
        id: record.id,
      }
    })
    logger.forBot().info(`Successful - Get Table Records - ${validatedInput.tableIdOrName}`)
    return { records }
  } catch (error) {
    logger.forBot().debug(`'Get Table Records' exception ${JSON.stringify(error)}`)
    return { records: [] }
  }
}
