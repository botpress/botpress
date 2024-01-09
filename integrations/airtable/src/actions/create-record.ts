import { createRecordInputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'
import { getClient } from '../utils'

export const createRecord: Implementation['actions']['createRecord'] = async ({
  ctx,
  logger,
  input,
}) => {
  const validatedInput = createRecordInputSchema.parse(input)
  const AirtableClient = getClient(ctx.configuration)
  let record
  try {
    record = await AirtableClient.createRecord(
      validatedInput.tableIdOrName,
      JSON.parse(validatedInput.fields)
    )
    record = {
      _rawJson: record.fields,
      id: record.id,
    }
    logger.forBot().info(`Successful - Create Record - ${record.id}`)
  } catch (error) {
    record = {
      _rawJson: {},
      id: '',
    }
    logger.forBot().debug(`'Create Record' exception ${JSON.stringify(error)}`)
  }

  return record
}
