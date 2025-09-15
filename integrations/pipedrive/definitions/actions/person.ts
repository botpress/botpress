import { z, ActionDefinition } from '@botpress/sdk'

const findPerson: ActionDefinition = {
  title: 'Find Person',
  description: 'Search for a person in Pipedrive',
  input: {
    schema: z.object({
      term: z.string().min(2).title('Search Term').describe('The search term to look for (minimum 2 characters)'),
      fields: z.enum(['name','email','phone','notes','custom_fields']).optional().title('Fields to Search').describe('Which fields to search in (name, email, phone, notes, custom_fields)'),
      exact_match: z.boolean().optional().title('Exact Match').describe('Whether to search for exact matches only'),
    }),
  },
  output: {
    schema: z.object({
      persons: z.array(z.unknown()).title('Persons').describe('The persons found (raw SDK data)'),
    }),
  },
}

const createPerson: ActionDefinition = {
    title: 'Create Person',
    description: 'Create a person in Pipedrive',
    input: {
        schema: z.object({
            name: z.string().title('Name').describe('The name of the person'),
            owner_id: z.number().optional().title('Owner ID').describe('The ID of the owner of the person'),
            org_id: z.number().optional().title('Organization ID').describe('The ID of the organization the person belongs to'),
            emailValue: z.string().optional().title('Email').describe('Email address'),
            emailPrimary: z.boolean().optional().title('Email is Primary').describe('Mark the email as primary'),
            phoneValue: z.string().optional().title('Phone Number').describe('Phone number'),
            phonePrimary: z.boolean().optional().title('Phone is Primary').describe('Mark the phone as primary'),
            visible_to: z.number().optional().title('Visible To').describe('The visibility of the person')
        })
    },
    output: {
        schema: z.object({
            person: z.unknown().title('Person').describe('Raw SDK person returned by Pipedrive'),
        })
    }
}

const updatePerson: ActionDefinition = {
    title: 'Update Person',
    description: 'Update a person in Pipedrive',
    input: {
        schema: z.object({
            person_id: z.number().title('Person ID').describe('The ID of the person to update'),
            name: z.string().optional().title('Name').describe('The name of the person'),
            emailValue: z.string().optional().title('Email').describe('Email address'),
            emailPrimary: z.boolean().optional().title('Email is Primary').describe('Mark the email as primary'),
            phoneValue: z.string().optional().title('Phone Number').describe('Phone number'),
            phonePrimary: z.boolean().optional().title('Phone is Primary').describe('Mark the phone as primary'),
            org_id: z.number().optional().title('Organization ID').describe('The ID of the organization the person belongs to'),
            owner_id: z.number().optional().title('Owner ID').describe('The ID of the owner of the person'),
            visible_to: z.number().optional().title('Visible To').describe('The visibility of the person')
        })
    },
    output: {
        schema: z.object({
            person: z.unknown().title('Person').describe('Raw SDK person returned by Pipedrive'),
        })
    }
}

export const actions = {
  findPerson,
  createPerson,
  updatePerson
} as const