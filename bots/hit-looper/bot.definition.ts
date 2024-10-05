import * as sdk from '@botpress/sdk'
import telegram from '@botpresshub/telegram/integration.definition'
import zendesk from '@botpresshub/zendesk/integration.definition'

const telegramPkg = {
  type: 'integration',
  definition: telegram,
} satisfies sdk.IntegrationPackage

const zendeskPkg = {
  type: 'integration',
  definition: zendesk,
} satisfies sdk.IntegrationPackage

export default new sdk.BotDefinition({
  configuration: {
    schema: sdk.z.object({}),
  },
  states: {
    flow: {
      type: 'conversation',
      schema: sdk.z.object({
        hitlEnabled: sdk.z.boolean(),
      }),
    },
  },
  events: {},
  recurringEvents: {},
  user: {
    tags: {
      downstream: {
        title: 'Downstream User ID',
        description: 'ID of the downstream user binded to the upstream one',
      },
      upstream: {
        title: 'Upstream User ID',
        description: 'ID of the upstream user binded to the downstream one',
      },
    },
  },
  conversation: {
    tags: {
      downstream: {
        title: 'Downstream Conversation ID',
        description: 'ID of the downstream conversation binded to the upstream one',
      },
      upstream: {
        title: 'Upstream Conversation ID',
        description: 'ID of the upstream conversation binded to the downstream one',
      },
    },
  },
})
  .add(telegramPkg, {
    enabled: true,
    configurationType: null,
    configuration: {
      botToken: '$BOT_TOKEN',
    },
  })
  .add(zendeskPkg, {
    enabled: true,
    configurationType: null,
    configuration: {
      apiToken: '$API_TOKEN',
      email: '$EMAIL',
      organizationSubdomain: '$ORGANIZATION_SUBDOMAIN',
    },
  })
