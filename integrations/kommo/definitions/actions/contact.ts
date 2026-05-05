import { z, ActionDefinition } from '@botpress/sdk'

export const contactSchema = z.object({
  id: z.number().describe('Contact ID'),
  name: z.string().describe('Contact name'),
  firstName: z.string().describe('First name'),
  lastName: z.string().describe('Last name'),
  responsibleUserId: z.number().describe('User responsible for this contact'),
  groupId: z.number().describe('Group ID'),
  updatedBy: z.number().describe('User who last updated this contact'),
  createdAt: z.number().describe('When created (Unix timestamp)'),
  updatedAt: z.number().describe('When last updated (Unix timestamp)'),
  closestTaskAt: z.number().optional().describe('Closest task timestamp'),
  isDeleted: z.boolean().describe('Whether contact is deleted'),
  accountId: z.number().describe('Account ID'),
})

const createContact: ActionDefinition = {
  title: 'Create Contact',
  description: 'Creates a new contact',
  input: {
    schema: z.object({
      name: z.string().optional().title('Full contact name').describe('Full contact name'),
      firstName: z.string().optional().title('First name').describe('First name'),
      lastName: z.string().optional().title('Last name').describe('Last name'),
      responsibleUserId: z.number().title('Responsible User ID').describe('User ID to assign this contact to'),
      createdBy: z.number().title('Created By').describe('User ID who creates this contact'),
      updatedBy: z.number().optional().title('Updated By').describe('User ID who updates this contact'),
    }),
  },
  output: {
    schema: z.object({
      contact: contactSchema.describe('The created contact'),
    }),
  },
}
const searchContacts: ActionDefinition = {
  title: 'Search Contacts',
  description: 'Search for contacts by name, phone number, or email',
  input: {
    schema: z.object({
      query: z.string().describe('Search query (name, phone number, or email)'),
    }),
  },
  output: {
    schema: z.object({
      contacts: z.array(contactSchema).describe('Array of matching contacts (empty if none found)'),
    }),
  },
}

export const actions = {
  createContact,
  searchContacts,
} as const
