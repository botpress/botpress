import type { IntegrationDefinition } from '@botpress/sdk'
import type { compile } from 'json-schema-to-typescript'

export type File = { path: string; content: string }
export type Schema = Parameters<typeof compile>[0]

export type Def<T> = Exclude<T, undefined>
export type Config = Def<IntegrationDefinition['configuration']>
export type Channel = Def<IntegrationDefinition['channels']>[string]
export type Message = Def<Channel['messages']>[string]
export type Action = Def<IntegrationDefinition['actions']>[string]
export type Event = Def<IntegrationDefinition['events']>[string]
