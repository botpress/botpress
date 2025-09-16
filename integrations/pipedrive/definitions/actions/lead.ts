import { z, ActionDefinition } from '@botpress/sdk'

const createLead: ActionDefinition = {
    title: 'Create Lead',
    description: 'Create a lead in Pipedrive',
    input: {
        schema: z.object({
            title: z.string().title('Name').describe('The name of the lead'),
            owner_id: z.number().optional().title('Owner ID').describe('The ID of the owner of the lead'),
            person_id: z.number().optional().title('Person ID').describe('The ID of the person the lead is associated with'),
            organization_id: z.number().optional().title('Organization ID').describe('The ID of the organization the lead is associated with'),
            value: z.object({
                amount: z.number().title('Amount').describe('The amount of the lead'),
            currency: z.string().title('Currency').describe('The currency of the lead')
            }).optional().title('Value').describe('Value object { amount, currency }'),
            expected_close_date: z.string().optional().title('Expected Close Date').describe('The expected close date of the lead'),
            visible_to: z.enum(['1','3','5','7']).optional().title('Visible To').describe('The visibility of the lead')
        })
    },
    output: {
        schema: z.object({
            lead: z.unknown().title('Lead').describe('Raw lead payload returned by Pipedrive'),
        })
    }
}

const updateLead: ActionDefinition = {
    title: 'Update Lead',
    description: 'Update a lead in Pipedrive',
    input: {
        schema: z.object({
            lead_id: z.string().title('Lead ID').describe('The ID of the lead to update'),
            title: z.string().optional().title('Name').describe('The name of the lead'),
            owner_id: z.number().optional().title('Owner ID').describe('The ID of the owner of the lead'),
            person_id: z.number().optional().title('Person ID').describe('The ID of the person the lead is associated with'),
            organization_id: z.number().optional().title('Organization ID').describe('The ID of the organization the lead is associated with'),
            value: z.object({
                amount: z.number().title('Amount').describe('The amount of the lead'),
                currency: z.string().title('Currency').describe('The currency of the lead')
            }).optional().title('Value').describe('Value object { amount, currency }'),
            expected_close_date: z.string().optional().title('Expected Close Date').describe('The expected close date of the lead'),
            visible_to: z.enum(['1','3','5','7']).optional().title('Visible To').describe('The visibility of the lead')
        })
    },
    output: {
        schema: z.object({
            lead: z.unknown().title('Lead').describe('Raw lead payload returned by Pipedrive'),
        })
    }
}

const findLead: ActionDefinition = {
    title: 'Find Lead',
    description: 'Find a lead in Pipedrive',
    input: {
        schema: z.object({
            term: z.string().title('Search Term').describe('The search term to find leads'),
            fields: z.enum(['title','notes','custom_fields']).optional().title('Fields to Search').describe('Which fields to search in (title, notes, custom_fields)'),
            person_id: z.number().optional().title('Person ID').describe('Filter leads by associated person ID'),
            organization_id: z.number().optional().title('Organization ID').describe('Filter leads by associated organization ID'),
            exact_match: z.boolean().optional().title('Exact Match').describe('Whether to search for exact matches only')
        })
    },
    output: {
        schema: z.object({
            lead: z.array(z.unknown()).title('Leads').describe('Raw lead results returned by Pipedrive'),
        })
    }
}

export const actions = {
    createLead,
    updateLead,
    findLead
} as const
