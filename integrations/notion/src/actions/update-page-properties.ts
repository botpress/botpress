import { RuntimeError } from '@botpress/client'
import { updatePagePropertiesSchema } from '../../definitions/notion-schemas'
import { wrapAction } from '../action-wrapper'

export const updatePageProperties = wrapAction(
  { actionName: 'updatePageProperties', errorMessage: 'Failed to update page properties' },
  async ({ notionClient }, { pageId, propertiesJson }) => {
    let parsed: unknown

    if (!propertiesJson) {
      throw new RuntimeError('propertiesJson is required')
    }

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

    const updatedPage = await notionClient
      .updatePageProperties({ pageId, properties: updatePagePropertiesResult.data })
      .catch((thrown) => {
        const error = thrown instanceof Error ? thrown : new Error(String(thrown))
        throw new RuntimeError(`Failed to update page properties: ${error.message}`)
      })

    return {
      pageId: updatedPage.id,
    }
  }
)
