import * as sdk from '@botpress/sdk'

export default new sdk.InterfaceDefinition({
  name: 'message-state',
  version: '0.0.1',
  title: 'Message State',
  description: 'Common delivery state events for messaging integrations',
  events: {
    messageSent: {
      schema: () => sdk.z.object({}),
    },
    messageDelivered: {
      schema: () => sdk.z.object({}),
    },
    messageRead: {
      schema: () => sdk.z.object({}),
    },
    messageFailed: {
      schema: () =>
        sdk.z.object({
          reason: sdk.z.string().title('Failure Reason').describe('Reason the message failed'),
          metadata: sdk.z
            .record(sdk.z.string())
            .title('Failure Metadata')
            .describe('Provider-specific details about the message failure'),
        }),
    },
  },
})
