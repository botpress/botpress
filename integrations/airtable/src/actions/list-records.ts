import { RuntimeError } from '@botpress/sdk'
import type { IntegrationProps } from '../misc/types'
import { getClient } from '../utils'

export const listRecords: IntegrationProps['actions']['listRecords'] = async ({ ctx, logger, input }) => {
  const AirtableClient = getClient(ctx.configuration)

  try {
    const output = await AirtableClient.listRecords({
      tableIdOrName: input.tableIdOrName,
      filterByFormula: input.filterByFormula,
      offset: input.nextToken,
    })

    const records = output.records.map((record) => ({
      _rawJson: record.fields,
      id: record.id,
    }))

    logger.forBot().info(`Successful - List Records - ${input.tableIdOrName}`)
    return { records, nextToken: output.offset }
  } catch (error) {
    logger.forBot().debug(`'List Records' exception ${JSON.stringify(error)}`)
    throw new RuntimeError(`'List Records' exception ${JSON.stringify(error)}`)
  }
}
