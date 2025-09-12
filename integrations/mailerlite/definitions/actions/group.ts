import { z, ActionDefinition } from '@botpress/sdk'
import { groupsResponseSchema, subscriberSchema } from '../schemas'

const listGroups: ActionDefinition = {
    title: 'List Groups',
    description: 'List all the groups',
    input: {
        schema: z.object({
            limit: z.number().title('Max number of groups to show').describe('Limits the number of groups that the API returns').optional(),
            name: z.string().title('Name to filter for').describe('Can return partial matches as well').optional(),
            sort: z
                .enum(['name', 'total', 'open_rate', 'click_rate', 'created_at', '-name', '-total', '-open_rate', '-click_rate', '-created_at'])
                .title('Sort Results')
                .describe('One of name, total, open_rate, click_rate, created_at. Prepend - for descending (e.g. -total).')
                .optional(),
        })
    },
    output: {
        schema: groupsResponseSchema
    }
}

export const actions = {
    listGroups,
} as const