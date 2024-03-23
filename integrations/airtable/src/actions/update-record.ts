import { updateRecordInputSchema } from '../misc/custom-schemas'
import type { IntegrationProps } from '../misc/types'
import { getClient } from '../utils'

export const updateRecord: IntegrationProps['actions']['updateRecord'] = async ({ ctx, logger, input }) => {
  const validatedInput = updateRecordInputSchema.parse(input)
  const AirtableClient = getClient(ctx.configuration)

  try {
    const output = await AirtableClient.updateRecord(
      validatedInput.tableIdOrName,
      validatedInput.recordId,
      JSON.parse(validatedInput.fields)
    )
    const record = {
      _rawJson: output.fields,
      id: output.id,
    }
    logger.forBot().info(`Successful - Update Record - ${record.id}`)
    return record
  } catch (error) {
    logger.forBot().debug(`'Update Record' exception ${JSON.stringify(error)}`)
    return {
      _rawJson: {},
      id: '',
    }
  }
}
