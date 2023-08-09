import type { IntegrationContext, IntegrationDefinition } from '@botpress/sdk'
import type { getTriggerTemplate } from 'src/client'
import type * as botpress from '.botpress'

type IntegrationDef = ConstructorParameters<typeof IntegrationDefinition>[0]
export type EventDefinition = Extract<IntegrationDef['events'], {}>['string']
export type ActionDefinition = Extract<IntegrationDef['actions'], {}>['string']
export type ChannelDefinition = Extract<IntegrationDef['channels'], {}>['string']
export type IntegrationCtx = IntegrationContext<botpress.configuration.Configuration>

export type Implementation = ConstructorParameters<typeof botpress.Integration>[0]
export type RegisterFunction = Implementation['register']
export type UnregisterFunction = Implementation['unregister']
export type CreateConversationFunction = Implementation['createConversation']
export type CreateUserFunction = Implementation['createUser']
export type Channels = Implementation['channels']

export type Customer = {
  name: string
  email: string
  phone: string
  tags: { [key: string]: string } // TODO: check this
}

export type TicketRequester = {
  name: string
  email: string
}

export type Webhook = {
  id: string
}

export type Trigger = {
  url: string
  id: string
}

type Condition = {
  field: string
  operator: string
  value: string
}

export type ConditionsData = {
  all: Condition[]
  any: Condition[]
}

const TRIGGER_NAMES = ['TicketAssigned', 'TicketSolved', 'NewMessage'] as const
export type TriggerNames = (typeof TRIGGER_NAMES)[number]

export type TriggerPayload = ReturnType<typeof getTriggerTemplate>

// TODO: user fields
// user: {
//   id: 18364722289165,
//   url: 'https://botpress6143.zendesk.com/api/v2/users/18364722289165.json',
//   name: 'Lol1',
//   email: 'lol1@botpress.com',
//   created_at: '2023-08-09T14:28:59Z',
//   updated_at: '2023-08-09T16:28:35Z',
//   time_zone: 'America/Toronto',
//   iana_time_zone: 'America/Toronto',
//   phone: null,
//   shared_phone_number: null,
//   photo: null,
//   locale_id: 1,
//   locale: 'en-US',
//   organization_id: null,
//   role: 'end-user',
//   verified: false,
//   external_id: '2b3f3418-04b6-4e4b-a69f-1603e20c79eb',
//   tags: [],
//   alias: null,
//   active: true,
//   shared: false,
//   shared_agent: false,
//   last_login_at: null,
//   two_factor_auth_enabled: false,
//   signature: null,
//   details: null,
//   notes: null,
//   role_type: null,
//   custom_role_id: null,
//   moderator: false,
//   ticket_restriction: 'requested',
//   only_private_comments: false,
//   restricted_agent: true,
//   suspended: false,
//   default_group_id: null,
//   report_csv: false,
//   user_fields: {}
// }
