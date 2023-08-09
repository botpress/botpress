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
