import { updatePagePropertiesSchema } from 'definitions/notion-schemas'
import { wrapAction } from '../action-wrapper'
import { RuntimeError } from '@botpress/client'

export const createPage = wrapAction(
  { actionName: 'createPage', errorMessage: 'Failed to create page' },
  async ({ notionClient }, { parentType, parentId, title, propertiesJson }) => {
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
    return await notionClient.createPage({ parentType, parentId, title, properties: updatePagePropertiesResult.data }) // TODO: fix type and bump major
  }
)
