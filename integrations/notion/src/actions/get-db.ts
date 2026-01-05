import { wrapAction } from '../action-wrapper'

export const getDb = wrapAction(
  { actionName: 'getDb', errorMessage: 'Failed to fetch database' },
  async ({ notionClient }, { databaseId }) => {
    const result = await notionClient.getDbWithStructure({ databaseId })
    
    // Ensure we have properties field for the output type
    if (!('properties' in result)) {
      throw new Error('Data source does not have properties')
    }
    
    return result
  }
)
