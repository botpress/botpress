import { z, ActionDefinition } from '@botpress/sdk'
import { groupSchema, groupsResponseSchema, subscriberSchema } from '../schemas'

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

const assignToGroup: ActionDefinition = {
    title: 'Assign Subscriber to Group',
    description: 'Assigns a subscriber to a group, to allow for targeted marketing',
    input: {
        schema: z.object({
            subscriberId: z.string().title('Subscriber Id').describe('Id of subscriber to assign to a group').min(1),
            groupId: z.string().title('Group Id').describe('Id of group to assign subscriber to').min(1),
        })
    },
    output: {
        schema: z.
            object({
                success: z.boolean(),
                message: z.string(),
                group: groupSchema.optional(),
            }),
    }
}

const unassignFromGroup: ActionDefinition = {
    title: 'Unassign from group',
    description: 'Unassign subscriber from a group',
    input: {
        schema: z.object({
            subscriberId: z.string().title('Subscriber Id').describe('Id of subscriber to assign to a group').min(1),
            groupId: z.string().title('Group Id').describe('Id of group to assign subscriber to').min(1),
        })
    },
    output: {
        schema: z.object({
            success: z.boolean().title('Success of unassignment').describe('Boolean representing the success of the unassignment operation'),
            message: z.string().title('Return message for more description').describe('Description of success of the unassignment operation')
        })
    }
}

export const actions = {
    listGroups,
    assignToGroup,
    unassignFromGroup,
} as const