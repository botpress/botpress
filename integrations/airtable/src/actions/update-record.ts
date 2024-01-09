import { updateRecordInputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'
import { getClient } from '../utils'

export const updateRecord: Implementation['actions']['updateRecord'] = async ({
  ctx,
  logger,
  input,
}) => {
  const validatedInput = updateRecordInputSchema.parse(input)
  const AirtableClient = getClient(ctx.configuration)
  let record
  try {
    record = await AirtableClient.updateRecord(
      validatedInput.tableIdOrName,
      validatedInput.recordId,
      JSON.parse(validatedInput.fields)
    )
    record = {
      _rawJson: record.fields,
      id: record.id,
    }
    logger.forBot().info(`Successful - Update Record - ${record.id}`)
  } catch (error) {
    record = {
      _rawJson: {},
      id: '',
    }
    logger.forBot().debug(`'Update Record' exception ${JSON.stringify(error)}`)
  }

  return record
}
