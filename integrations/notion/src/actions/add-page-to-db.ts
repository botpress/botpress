import { wrapAction } from '../action-wrapper'

export const addPageToDb = wrapAction(
  { actionName: 'addPageToDb', errorMessage: 'Failed to add page to database' },
  async ({ notionClient }, { databaseId, pageProperties }) => {
    await notionClient.addPageToDb({ databaseId, properties: pageProperties as any }) // TODO: fix type and bump major
  }
)
