import * as sdk from '@botpress/sdk'
import * as genenv from './.genenv'
import gmail from './bp_modules/gmail'
import slack from './bp_modules/slack'

export default new sdk.BotDefinition({
  states: {
    slackConversationId: {
      type: 'bot',
      schema: sdk.z.object({
        conversationId: sdk.z
          .string()
          .title('Slack Conversation ID')
          .describe('The ID of the Slack conversation to send email notifications to')
          .optional(),
      }),
    },
  },
})
  .addIntegration(gmail, {
    enabled: true,
    configurationType: 'customApp',
    configuration: {
      oauthClientId: genenv.SLACKBOX_GMAIL_OAUTH_CLIENT_ID,
      oauthClientSecret: genenv.SLACKBOX_GMAIL_OAUTH_CLIENT_SECRET,
      oauthAuthorizationCode: genenv.SLACKBOX_GMAIL_OAUTH_AUTHORIZATION_CODE,
      pubsubTopicName: genenv.SLACKBOX_GMAIL_PUBSUB_TOPIC_NAME,
      pubsubWebhookSharedSecret: genenv.SLACKBOX_GMAIL_PUBSUB_WEBHOOK_SHARED_SECRET,
      pubsubWebhookServiceAccount: genenv.SLACKBOX_GMAIL_PUBSUB_WEBHOOK_SERVICE_ACCOUNT,
    },
  })
  .addIntegration(slack, {
    enabled: true,
    configurationType: 'refreshToken',
    configuration: {
      refreshToken: genenv.SLACKBOX_SLACK_REFRESH_TOKEN,
      clientId: genenv.SLACKBOX_SLACK_CLIENT_ID,
      clientSecret: genenv.SLACKBOX_SLACK_CLIENT_SECRET,
      signingSecret: genenv.SLACKBOX_SLACK_SIGNING_SECRET,
      typingIndicatorEmoji: false,
    },
  })
