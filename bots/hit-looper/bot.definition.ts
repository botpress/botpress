import * as sdk from '@botpress/sdk'
import * as genenv from './.genenv'
import hitl from './bp_modules/hitl'
import telegram from './bp_modules/telegram'
import zendesk from './bp_modules/zendesk'

const zendeskHitl = zendesk.definition.interfaces['hitl']

export default new sdk.BotDefinition({
  configuration: {
    schema: sdk.z.object({}),
  },
  states: {},
  events: {},
  recurringEvents: {},
  user: {},
  conversation: {},
})
  .addIntegration(telegram, {
    enabled: true,
    configuration: {
      botToken: genenv.HITLOOPER_TELEGRAM_BOT_TOKEN,
    },
  })
  .addIntegration(zendesk, {
    enabled: true,
    configuration: {
      apiToken: genenv.HITLOOPER_ZENDESK_API_TOKEN,
      email: genenv.HITLOOPER_ZENDESK_EMAIL,
      organizationSubdomain: genenv.HITLOOPER_ZENDESK_ORGANIZATION_SUBDOMAIN,
    },
  })
  .addPlugin(hitl, {
    configuration: {},
    interfaces: {
      hitl: {
        id: zendesk.id,
        name: zendesk.name,
        version: zendesk.version,
        entities: zendeskHitl.entities,
        actions: zendeskHitl.actions,
        events: zendeskHitl.events,
        channels: zendeskHitl.channels,
      },
    },
  })
