import * as botpress from '.botpress'

export type Config = botpress.configuration.Configuration
export type Implementation = botpress.IntegrationProps

export type RegisterFunction = Implementation['register']
export type UnregisterFunction = Implementation['unregister']
export type Channels = Implementation['channels']
export type Handler = Implementation['handler']
