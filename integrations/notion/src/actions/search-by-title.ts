import { wrapAction } from '../action-wrapper'

export const searchByTitle = wrapAction(
  { actionName: 'searchByTitle', errorMessage: 'Failed to search by title' },
  async ({ notionClient }, { title }) => {
    return await notionClient.searchByTitle({ title })
  }
)
