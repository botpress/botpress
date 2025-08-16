/* bplint-disable */
import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

export default new IntegrationDefinition({
  name: 'twilio',
  version: '0.5.0',
  title: 'Twilio',
  description: 'Send and receive messages, voice calls, emails, SMS, and more.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      accountSID: z.string().min(1),
      authToken: z.string().min(1),
      downloadMedia: z
        .boolean()
        .default(true)
        .title('Download Media')
        .describe(
          'Automatically download media files using the Files API for content access. If disabled, temporary Twilio media URLs will be used, which require authentication.'
        ),
      downloadedMediaExpiry: z
        .number()
        .default(24)
        .optional()
        .title('Downloaded Media Expiry')
        .describe(
          'Expiry time in hours for downloaded media files. An expiry time of 0 means the files will never expire.'
        ),
    }),
  },
  channels: {
    channel: {
      messages: { ...messages.defaults, markdown: messages.markdown },
      message: {
        tags: {
          id: {},
        },
      },
      conversation: {
        tags: {
          userPhone: {},
          activePhone: {},
        },
        creation: { enabled: true, requiredTags: ['userPhone', 'activePhone'] },
      },
    },
  },
  actions: {},
  events: {},
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
  user: {
    tags: {
      userPhone: {},
    },
    creation: { enabled: true, requiredTags: ['userPhone'] },
  },
})
