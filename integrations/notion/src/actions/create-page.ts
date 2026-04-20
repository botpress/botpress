import { wrapAction } from '../action-wrapper'

export const createPage = wrapAction(
  { actionName: 'createPage', errorMessage: 'Failed to create page' },
  async ({ notionClient }, { parentType, parentId, title, dataSourceTitleName }) => {
    if (!dataSourceTitleName) {
      dataSourceTitleName = 'Name' // default title property name for data sources
    }
    return await notionClient.createPage({ parentType, parentId, title, dataSourceTitleName })
  }
)
