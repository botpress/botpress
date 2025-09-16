import { z, ActionDefinition } from '@botpress/sdk'

const createNote: ActionDefinition = {
    title: 'Create Note',
    description: 'Create a note in Pipedrive',
    input: {
        schema: z.object({
            content: z.string().title('Content').describe('The content of the note'),
            lead_id: z.string().uuid().optional().title('Lead ID').describe('The ID (UUID) of the lead the note is associated with'),
            person_id: z.number().optional().title('Person ID').describe('The ID of the person the note is associated with'),
            deal_id: z.number().optional().title('Deal ID').describe('The ID of the deal the note is associated with'),
            org_id: z.number().optional().title('Organization ID').describe('The ID of the organization the note is associated with'),
            project_id: z.number().optional().title('Project ID').describe('The ID of the project the note is associated with'),
            user_id: z.number().optional().title('User ID').describe('The ID of the user the note is associated with'),
        })
    },
    output: {
        schema: z.object({
            note: z.unknown().title('Note').describe('Raw note payload returned by Pipedrive'),
        })
    }
}

export const actions = {
    createNote
} as const
