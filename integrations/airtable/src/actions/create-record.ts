import { createRecordInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'
import { getClient } from '../utils'

export const createRecord: IntegrationProps['actions']['createRecord'] = async ({ ctx, logger, input }) => {
  const validatedInput = createRecordInputSchema.parse(input)
  const AirtableClient = getClient(ctx.configuration)

  try {
    const record = await AirtableClient.createRecord(validatedInput.tableIdOrName, JSON.parse(validatedInput.fields))
    logger.forBot().info(`Successful - Create Record - ${record.id}`)
    return {
      _rawJson: record.fields,
      id: record.id,
    }
  } catch (error) {
    logger.forBot().debug(`'Create Record' exception ${JSON.stringify(error)}`)
    return {
      _rawJson: {},
      id: '',
    }
  }
}
