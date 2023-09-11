import type { Implementation } from '../misc/types'
import {
  getTableRecordsInputSchema,
  getTableRecordsOutputSchema,
} from '../misc/custom-schemas'
import { getClient } from '../utils'

export const getTableRecords: Implementation['actions']['getTableRecords'] =
  async ({ ctx, logger, input }) => {
    const validatedInput = getTableRecordsInputSchema.parse(input)
    const AirtableClient = getClient(ctx.configuration)
    let records
    try {
      records = await AirtableClient.getTableRecords(
        validatedInput.tableIdOrName
      )
      records = records.map((record) => {
        return {
          _rawJson: record.fields,
          id: record.id,
        }
      })
      logger
        .forBot()
        .info(
          `Successful - Get Table Records - ${validatedInput.tableIdOrName}`
        )
    } catch (error) {
      logger
        .forBot()
        .debug(`'Get Table Records' exception ${JSON.stringify(error)}`)
    }

    return getTableRecordsOutputSchema.parse({ records })
  }
