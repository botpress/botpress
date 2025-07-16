import { wrapAction } from '../action-wrapper'

export const getDb = wrapAction(
  { actionName: 'getDb', errorMessage: 'Failed to fetch database' },
  async ({ notionClient }, { databaseId }) => {
    return await notionClient.getDbWithStructure({ databaseId })
  }
)
