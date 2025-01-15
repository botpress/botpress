import * as notion from '../notion'
import * as bp from '.botpress'

/**
 * @returns the response along with a structure - refer to the [getDbStructure](../notion/notion.ts) function for more details
 */
export const getDb: bp.IntegrationProps['actions']['getDb'] = async ({ ctx, input }) => {
  const defaultResponse = { properties: {}, object: 'database', structure: '' }
  try {
    const response = await notion.getDb(ctx, input.databaseId)
    if (response) {
      console.info(
        `Successfully fetched the database - "${(response as any)?.title?.[0]?.plain_text || 'Title not found'}"`
      )
      return { ...response, structure: notion.getDbStructure(response) }
    } else {
      return defaultResponse
    }
  } catch {
    return defaultResponse
  }
}
