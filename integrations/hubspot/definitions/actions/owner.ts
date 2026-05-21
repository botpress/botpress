import { z, ActionDefinition } from '@botpress/sdk'

export const ownerSchema = z.object({
  id: z.string().title('Owner ID').describe('The ID of the owner'),
  email: z.string().optional().title('Email').describe('The email of the owner'),
  firstName: z.string().optional().title('First Name').describe('The first name of the owner'),
  lastName: z.string().optional().title('Last Name').describe('The last name of the owner'),
  userId: z.number().optional().title('User ID').describe('The Hubspot user ID associated with the owner'),
  type: z.string().title('Type').describe('The type of owner (e.g. PERSON, QUEUE)'),
  archived: z.boolean().title('Archived').describe('Whether the owner is archived'),
  createdAt: z.string().title('Created At').describe('The date and time the owner was created'),
  updatedAt: z.string().title('Updated At').describe('The date and time the owner was last updated'),
})

const getOwner: ActionDefinition = {
  title: 'Get Owner',
  description: 'Get a Hubspot owner (user) by ID. Used to resolve owner references on contacts, deals, etc.',
  input: {
    schema: z.object({
      ownerId: z.string().title('Owner ID').describe('The ID of the owner to fetch'),
    }),
  },
  output: {
    schema: z.object({
      owner: ownerSchema.optional().title('Owner').describe('The owner found, or undefined if not found'),
    }),
  },
}

export const actions = {
  getOwner,
} as const
