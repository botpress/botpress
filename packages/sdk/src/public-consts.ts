// This file contains constants that are exported for public use.

export const botIdHeader = 'x-bot-id'
export const botUserIdHeader = 'x-bot-user-id'
export const integrationIdHeader = 'x-integration-id'
export const webhookIdHeader = 'x-webhook-id'

export const configurationTypeHeader = 'x-bp-configuration-type'
export const configurationHeader = 'x-bp-configuration'
export const operationHeader = 'x-bp-operation'
export const typeHeader = 'x-bp-type'

export const WELL_KNOWN_ATTRIBUTES = {
  HIDDEN_IN_STUDIO: { bpActionHiddenInStudio: 'true' },
  AWAIT_RETURN: { bpActionAwaitReturn: 'true' },
} as const
