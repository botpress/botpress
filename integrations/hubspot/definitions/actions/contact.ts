import { z, ActionDefinition } from '@botpress/sdk'

export const contactSchema = z.object({
  id: z.string().title('Contact ID').describe('The ID of the contact'),
  email: z.string().title('Email').describe('The email of the contact'),
  phone: z.string().title('Phone').describe('The phone number of the contact'),
  createdAt: z.string().title('Created At').describe('The date and time the contact was created'),
  updatedAt: z.string().title('Updated At').describe('The date and time the contact was last updated'),
  properties: z.record(z.string().nullable()).title('Properties').describe('The properties of the contact'),
})

const searchContact: ActionDefinition = {
  title: 'Search Contact',
  description: 'Search for a contact in Hubspot',
  input: {
    schema: z.object({
      email: z.string().optional().title('Email').describe('The email of the contact to search for'),
      phone: z.string().optional().title('Phone').describe('The phone number of the contact to search for'),
    }),
  },
  output: {
    schema: z.object({
      contact: contactSchema.optional().title('Contact').describe('The contact found, or undefined if not found'),
    }),
  },
}

const createContact: ActionDefinition = {
  title: 'Create Contact',
  description: 'Create a contact in Hubspot',
  input: {
    schema: z.object({
      email: z.string().optional().title('Email').describe('The email of the contact'),
      phone: z.string().optional().title('Phone').describe('The phone number of the contact'),
      owner: z.string().optional().title('Owner').describe('The ID or email of the owner of the contact'),
      companies: z
        .array(
          z.object({
            idOrNameOrDomain: z
              .string()
              .title('Company ID, name or domain')
              .describe('The ID, name or domain of the company'),
            primary: z
              .boolean()
              .optional()
              .title('Primary Contact')
              .describe('Whether the contact is the primary contact for the company'),
          })
        )
        .optional()
        .title('Companies')
        .describe('The companies to which the contact is associated'),
      tickets: z
        .array(z.string().title('Ticket ID').describe('The ID of the ticket'))
        .optional()
        .title('Tickets')
        .describe('The tickets to which the contact is associated'),
      properties: z
        .array(
          z.object({
            name: z.string().title('Property Name').describe('The name of the property'),
            value: z.string().title('Property Value').describe('The value of the property'),
          })
        )
        .title('Additional Properties')
        .optional()
        .describe('Additional properties of the contact'),
    }),
  },
  output: {
    schema: z.object({
      contact: contactSchema.title('Contact').describe('The created contact'),
    }),
  },
}

const getContact: ActionDefinition = {
  title: 'Get Contact',
  description: 'Get a contact from Hubspot',
  input: {
    schema: z.object({
      contactIdOrEmail: z.string().title('Contact ID or Email').describe('The ID or email of the contact to get'),
    }),
  },
  output: {
    schema: z.object({
      contact: contactSchema.title('Contact').describe('The fetched contact'),
    }),
  },
}

const updateContact: ActionDefinition = {
  title: 'Update Contact',
  description: 'Update a contact in Hubspot',
  input: {
    schema: z.object({
      contactIdOrEmail: z.string().title('Contact ID or Email').describe('The ID or email of the contact to update'),
      email: z.string().optional().title('Email').describe('The new email of the contact'),
      phone: z.string().optional().title('Phone').describe('The new phone number of the contact'),
      properties: z
        .array(
          z.object({
            name: z.string().title('Property Name').describe('The name of the property'),
            value: z.string().title('Property Value').describe('The new value of the property'),
          })
        )
        .title('Additional Properties')
        .optional()
        .describe('Additional properties of the contact'),
    }),
  },
  output: {
    schema: z.object({
      contact: contactSchema
        .extend({
          // May not be returned by API
          phone: contactSchema.shape.phone.optional(),
          email: contactSchema.shape.email.optional(),
        })
        .title('Contact')
        .describe('The updated contact'),
    }),
  },
}

const deleteContact: ActionDefinition = {
  title: 'Delete Contact',
  description: 'Delete a contact in Hubspot',
  input: {
    schema: z.object({
      contactId: z.string().title('Contact ID').describe('The ID of the contact to delete'),
    }),
  },
  output: {
    schema: z.object({}).title('Empty').describe('Empty output'),
  },
}

const listContacts: ActionDefinition = {
  title: 'List Contacts',
  description: 'List contacts in Hubspot',
  input: {
    schema: z.object({
      meta: z
        .object({
          nextToken: z
            .string()
            .optional()
            .title('Pagination token')
            .describe('The token to get the next page of contacts'),
        })
        .title('Metadata')
        .describe('Metadata containing pagination information'),
    }),
  },
  output: {
    schema: z.object({
      contacts: z
        .array(contactSchema.title('Contact').describe('A contact'))
        .title('Contacts')
        .describe('The contacts found'),
      meta: z
        .object({
          nextToken: z
            .string()
            .optional()
            .title('Pagination token')
            .describe('The token to get the next page of contacts'),
        })
        .title('Metadata')
        .describe('Metadata containing pagination information'),
    }),
  },
}

export const actions = {
  searchContact,
  createContact,
  getContact,
  updateContact,
  deleteContact,
  listContacts,
} as const
