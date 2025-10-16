export * from './public-consts'

// This file contains constants that are not exported for public use.
// They are used internally in the SDK and should not be used outside of it.

// To export a constant, add it to the public-consts.ts file instead.

export const PLUGIN_PREFIX_SEPARATOR = '#'

export const BOT_ID_HEADER = 'x-bot-id'
export const BOT_USER_ID_HEADER = 'x-bot-user-id'
export const INTEGRATION_ID_HEADER = 'x-integration-id'
export const INTEGRATION_ALIAS_HEADER = 'x-integration-alias'
export const WEBHOOK_ID_HEADER = 'x-webhook-id'

export const CONFIGURATION_TYPE_HEADER = 'x-bp-configuration-type'
export const CONFIGURATION_PAYLOAD_HEADER = 'x-bp-configuration'
export const OPERATION_TYPE_HEADER = 'x-bp-operation'
export const OPERATION_SUBTYPE_HEADER = 'x-bp-type'
