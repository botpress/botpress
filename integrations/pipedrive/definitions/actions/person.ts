import { z, ActionDefinition } from '@botpress/sdk'
import {
  addPersonSchema,
  updatePersonSchema,
  findPersonSchema,
  upsertPersonOutputSchema,
  searchPersonOutputSchema,
} from '../schemas'

const addPerson: ActionDefinition = {
  title: 'Add Person',
  description: 'Add a person in Pipedrive',
  input: {
    schema: addPersonSchema,
  },
  output: {
    schema: z.object({
      success: z.boolean().optional(),
      data: upsertPersonOutputSchema.optional(),
    }),
  },
}

const updatePerson: ActionDefinition = {
  title: 'Update Person',
  description: 'Update a person in Pipedrive',
  input: {
    schema: updatePersonSchema,
  },
  output: {
    schema: z.object({
      success: z.boolean().optional(),
      data: upsertPersonOutputSchema.optional(),
    }),
  },
}

const findPerson: ActionDefinition = {
  title: 'Find Person',
  description: 'Search for a person in Pipedrive',
  input: {
    schema: findPersonSchema,
  },
  output: {
    schema: z.object({
      success: z.boolean().optional(),
      data: z
        .object({
          items: z.array(searchPersonOutputSchema).optional(),
        })
        .optional(),
      additional_data: z.unknown().optional(),
    }),
  },
}

export const actions = {
  addPerson,
  updatePerson,
  findPerson,
} as const
