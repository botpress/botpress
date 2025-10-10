// This file contains constants that are exported for public use.

export const BOT_ID_HEADER = 'x-bot-id'
export const BOT_USER_ID_HEADER = 'x-bot-user-id'
export const INTEGRATION_ID_HEADER = 'x-integration-id'
export const INTEGRATION_ALIAS_HEADER = 'x-integration-alias'
export const WEBHOOK_ID_HEADER = 'x-webhook-id'

export const CONFIGURATION_TYPE_HEADER = 'x-bp-configuration-type'
export const CONFIGURATION_PAYLOAD_HEADER = 'x-bp-configuration'
export const OPERATION_TYPE_HEADER = 'x-bp-operation'
export const OPERATION_SUBTYPE_HEADER = 'x-bp-type'

export const WELL_KNOWN_ATTRIBUTES = {
  HIDDEN_IN_STUDIO: { bpActionHiddenInStudio: 'true' },
  AWAIT_RETURN: { bpActionAwaitReturn: 'true' },
} as const
