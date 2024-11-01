import { wrapAction } from '../action-wrapper'

export const addSheet = wrapAction(
  { actionName: 'addSheet', errorMessageWhenFailed: 'Failed to add new sheet' },
  async ({ input, gsheetsClient }) =>
    await gsheetsClient.batchUpdate([
      {
        addSheet: {
          properties: {
            title: input.title,
          },
        },
      },
    ])
)
