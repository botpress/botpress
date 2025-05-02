/* bplint-disable */
import * as sdk from '@botpress/sdk'

export default new sdk.InterfaceDefinition({
  name: 'typingIndicator',
  version: '0.0.3',
  entities: {},
  events: {},
  actions: {
    startTypingIndicator: {
      attributes: {
        ...sdk.WELL_KNOWN_ATTRIBUTES.HIDDEN_IN_STUDIO,
      },
      input: {
        schema: () =>
          sdk.z.object({
            conversationId: sdk.z.string(),
            messageId: sdk.z.string().describe('The message ID to which the typing indicator should be attached'),
            timeout: sdk.z
              .number()
              .optional()
              .describe('The timeout in milliseconds after which the typing indicator should stop'),
          }),
      },
      output: {
        schema: () => sdk.z.object({}),
      },
    },
    stopTypingIndicator: {
      attributes: {
        ...sdk.WELL_KNOWN_ATTRIBUTES.HIDDEN_IN_STUDIO,
      },
      input: {
        schema: () =>
          sdk.z.object({
            conversationId: sdk.z.string(),
            messageId: sdk.z.string().describe('The message ID from which the typing indicator should be removed'),
          }),
      },
      output: {
        schema: () => sdk.z.object({}),
      },
    },
  },
})
