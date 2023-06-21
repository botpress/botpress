import { IntegrationContext, IntegrationDefinition } from '@botpress/sdk'
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
