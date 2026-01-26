import * as sdk from '@botpress/sdk'

export const entities = {
  conversation: {
    schema: sdk.z.object({
      id: sdk.z.string().min(1).title('Conversation ID').describe('The ID of the Slack conversation'),
    }),
  },
}
