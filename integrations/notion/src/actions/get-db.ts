import { RuntimeError } from '@botpress/sdk'
import { wrapAction } from '../action-wrapper'

export const getDb = wrapAction(
  { actionName: 'getDb', errorMessage: 'Failed to fetch database' },
  async ({ notionClient }, { databaseId }) => {
    const database = await notionClient.getDatabase({ databaseId })
    if (!database) {
      throw new RuntimeError(`Database with ID ${databaseId} not found`)
    }
    return database
  }
)
