import type { Implementation } from '../misc/types'
import { getClient } from '../utils'

export const getBaseTables: Implementation['actions']['getBaseTables'] =
  async ({ ctx, logger }) => {
    const AirtableClient = getClient(ctx.configuration)
    let tables
    try {
      tables = await AirtableClient.getBaseTables()
      logger.forBot().info(`Successful - Get Base Tables`)
    } catch (error) {
      logger
        .forBot()
        .debug(`'Get Base Tables' exception ${JSON.stringify(error)}`)
    }

    return {
      tables,
    }
  }
