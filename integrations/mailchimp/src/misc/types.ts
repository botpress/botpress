import type * as bp from '.botpress'

/**
 * @deprecated Use `bp.configuration.Configuration` instead
 */
export type Config = bp.configuration.Configuration

/**
 * @deprecated Use `bp.IntegrationProps` instead
 */
export type Implementation = bp.IntegrationProps

export type RegisterFunction = bp.IntegrationProps['register']
export type UnregisterFunction = bp.IntegrationProps['unregister']
export type CreateConversationFunction = bp.IntegrationProps['createConversation']
export type CreateUserFunction = bp.IntegrationProps['createUser']
export type Channels = bp.IntegrationProps['channels']
export type HandlerFunction = bp.IntegrationProps['handler']

export type HandlerProps = Parameters<HandlerFunction>[0]
export type Client = bp.Client // or HandlerProps['client']
export type IntegrationLogger = HandlerProps['logger']
export type IntegrationCtx = HandlerProps['ctx']
