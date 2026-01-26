import type * as botpress from '.botpress'

export type Config = botpress.configuration.Configuration
export type Implementation = ConstructorParameters<typeof botpress.Integration>[0]

export type RegisterFunction = Implementation['register']
export type UnregisterFunction = Implementation['unregister']
export type Channels = Implementation['channels']
export type Handler = Implementation['handler']
export type Client = botpress.Client
