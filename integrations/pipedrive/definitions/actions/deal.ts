import { z, ActionDefinition } from '@botpress/sdk'

const createDeal: ActionDefinition = {
    title: 'Create Deal',
    description: 'Create a deal in Pipedrive',
    input: {
        schema: z.object({
            title: z.string().title('Title').describe('The title of the deal'),
            value: z.number().optional().title('Value').describe('The value of the deal'),
            currency: z.string().optional().title('Currency').describe('The currency of the deal'),
            person_id: z.number().optional().title('Person ID').describe('The ID of the person the deal is associated with'),
            org_id: z.number().optional().title('Organization ID').describe('The ID of the organization the deal is associated with'),
            pipeline_id: z.number().optional().title('Pipeline ID').describe('The ID of the pipeline the deal is associated with'),
            stage_id: z.number().optional().title('Stage ID').describe('The ID of the stage the deal is associated with'),
            expected_close_date: z.string().optional().title('Expected Close Date').describe('The expected close date of the deal'),
            visible_to: z.number().optional().title('Visible To').describe('The visibility of the deal'),
        })
    },
    output: {
        schema: z.object({
            deal: z.unknown().title('Deal').describe('Raw deal payload returned by Pipedrive'),
        })
    }
}

const updateDeal: ActionDefinition = {
    title: 'Update Deal',
    description: 'Update a deal in Pipedrive',
    input: {
        schema: z.object({
            deal_id: z.number().title('Deal ID').describe('The ID of the deal to update'),
            title: z.string().optional().title('Title').describe('The title of the deal'),
            value: z.number().optional().title('Value').describe('The value of the deal'),
            currency: z.string().optional().title('Currency').describe('The currency of the deal'),
            person_id: z.number().optional().title('Person ID').describe('The ID of the person the deal is associated with'),
            org_id: z.number().optional().title('Organization ID').describe('The ID of the organization the deal is associated with'),
            stage_id: z.number().optional().title('Stage ID').describe('The ID of the stage the deal is associated with'),
            expected_close_date: z.string().optional().title('Expected Close Date').describe('The expected close date of the deal'),
            visible_to: z.number().optional().title('Visible To').describe('The visibility of the deal'),
        })
    },
    output: {
        schema: z.object({
            deal: z.unknown().title('Deal').describe('Raw deal payload returned by Pipedrive'),
        })
    }
}

const findDeal: ActionDefinition = {
    title: 'Find Deal',
    description: 'Find a deal in Pipedrive',
    input: {
        schema: z.object({
            term: z.string().title('Search Term').describe('The search term to find deals'),
            fields: z.enum(['title','notes','custom_fields']).optional().title('Fields to Search').describe('Which fields to search in (title, notes, custom_fields)'),
            person_id: z.number().optional().title('Person ID').describe('Filter deals by associated person ID'),
            organization_id: z.number().optional().title('Organization ID').describe('Filter deals by associated organization ID'),
            exact_match: z.boolean().optional().title('Exact Match').describe('Whether to search for exact matches only'),
        })
    },
    output: {
        schema: z.object({
            deal: z.array(z.unknown()).title('Deals').describe('Raw deal results returned by Pipedrive'),
        })
    }
}

export const actions = {
    createDeal,
    updateDeal,
    findDeal
} as const