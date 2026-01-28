import * as sdk from '@botpress/sdk'

export default new sdk.InterfaceDefinition({
  name: 'typing-indicator',
  version: '0.0.4',
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
            conversationId: sdk.z
              .string()
              .title('Conversation ID')
              .describe('The ID of the conversation where the typing indicator should be shown'),
            messageId: sdk.z
              .string()
              .title('Message ID')
              .describe('The message ID to which the typing indicator should be attached'),
            timeout: sdk.z
              .number()
              .optional()
              .title('Typing Indicator Timeout')
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
            conversationId: sdk.z
              .string()
              .title('Conversation ID')
              .describe('The ID of the conversation where the typing indicator should be removed'),
            messageId: sdk.z
              .string()
              .title('Message ID')
              .describe('The message ID from which the typing indicator should be removed'),
          }),
      },
      output: {
        schema: () => sdk.z.object({}),
      },
    },
  },
  __advanced: {
    useLegacyZuiTransformer: true,
  },
})
