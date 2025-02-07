/* bplint-disable */ // zui `toTypescriptSchema` does not preserve title and description properties
import * as sdk from '@botpress/sdk'
import * as genenv from './.genenv'
import chat from './bp_modules/chat'
import hitl from './bp_modules/hitl'
import zendesk from './bp_modules/zendesk'

const zendeskHitl = zendesk.definition.interfaces['hitl']

export default new sdk.BotDefinition({
  configuration: {
    schema: sdk.z.object({}),
  },
  states: {},
  events: {},
  recurringEvents: {},
  user: {
    tags: {
      email: {
        title: 'Email',
        description: 'The email of the user',
      },
    },
  },
  conversation: {},
})
  .addIntegration(chat, {
    enabled: true,
    configuration: {},
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
