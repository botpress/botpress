import { z, StateDefinition } from '@botpress/sdk'

const mailerLiteIntegrationInfo = {
    type: 'integration' as const,
    schema: z.object({
        mailerLiteWebhookId: z.string()
    })
}

export const states = {
    mailerLiteIntegrationInfo
} as const satisfies Record<string, StateDefinition>