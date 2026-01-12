import { updatePagePropertiesSchema } from 'definitions/notion-schemas'
import { wrapAction } from '../action-wrapper'
import { RuntimeError } from '@botpress/client'

export const createPage = wrapAction(
  { actionName: 'createPage', errorMessage: 'Failed to create page' },
  async ({ notionClient }, { parentType, parentId, title }) => {
    return await notionClient.createPage({ parentType, parentId, title })
  }
)
