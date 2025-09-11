import { z, ActionDefinition } from '@botpress/sdk'
import { subscriberSchema } from '../schemas'


const fetchSubscriber: ActionDefinition = {
    title: 'Fetch Subscriber',
    description: 'Search subscriber by id or by email',
    input: {
        schema: z.object({
            id: z
                .string()
                .title("Subscriber id")
                .describe("Subscriber id to search for")
                .optional(),
            email: z
                .string()
                .title("Subscriber email")
                .describe("Subscriber email to search for")
                .optional()
        })
    },
    output: {
        schema: subscriberSchema
    }
}

export const actions = {
    fetchSubscriber,
} as const