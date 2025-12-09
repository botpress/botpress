import { wrapAction } from '../action-wrapper'

export const queryByTitle = wrapAction(
  { actionName: 'queryByTitle', errorMessage: 'Failed to query by title' },
  async ({ notionClient }, { title }) => {
    return await notionClient.searchByTitle({ title })
  }
)

