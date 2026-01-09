import { updatePagePropertiesSchema } from 'definitions/notion-schemas'
import { wrapAction } from '../action-wrapper'
import { RuntimeError } from '@botpress/client'

export const addPageToDb = wrapAction(
  { actionName: 'addPageToDb', errorMessage: 'Failed to add page to database' },
  async ({ notionClient }, { databaseId, propertiesJson }) => {
    let parsed: unknown

    try {
      parsed = JSON.parse(propertiesJson)
    } catch (thrown) {
      const error = thrown instanceof Error ? thrown : new Error(String(thrown))
      throw new RuntimeError(`propertiesJson must be valid JSON: ${error.message}`)
    }

    const updatePagePropertiesResult = updatePagePropertiesSchema.safeParse(parsed)
    if (!updatePagePropertiesResult.success) {
      throw new RuntimeError(
        `propertiesJson must be a valid Notion properties object. Check the Notion API documentation for the correct format. ${updatePagePropertiesResult.error.message}`
      )
    }
    return await notionClient.addPageToDb({ databaseId, properties: updatePagePropertiesResult.data }) // TODO: fix type and bump major
  }
)
