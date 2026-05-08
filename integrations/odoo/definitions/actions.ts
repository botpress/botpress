import { z, IntegrationDefinitionProps } from '@botpress/sdk'

const odooContextSchema = z
  .record(z.string(), z.unknown())
  .title('Context')
  .describe('Optional Odoo context values to pass with the request.')

const odooRecordSchema = z
  .record(z.string(), z.unknown())
  .title('Values')
  .describe('Odoo field values keyed by field name.')

const odooDomainConditionSchema = z.array(z.unknown())

const odooDomainSchema = z
  .array(z.union([odooDomainConditionSchema, z.enum(['&', '|', '!'])]))
  .title('Domain')
  .describe('Odoo domain filters, such as [["id", "in", [1, 2, 3]]].')

const fieldsSchema = z.array(z.string()).title('Fields').describe('Odoo field names to include in the response.')
const contactIdsSchema = z.array(z.number()).title('Contact IDs').describe('Odoo contact record IDs.')

const notDeletedContactSchema = z
  .object({
    id: z.number().title('Contact ID').describe('Odoo contact record ID.'),
    name: z.string().title('Contact Name').describe('Odoo contact display name.').optional(),
    reason: z.string().title('Reason').describe('Why the contact could not be deleted.'),
  })
  .title('Not Deleted Contact')
  .describe('An Odoo contact that could not be deleted.')

export const actions = {
  getCurrentUser: {
    title: 'Get Current User',
    description: 'Get the Odoo user ID associated with the configured API key.',
    input: {
      schema: z.object({}),
    },
    output: {
      schema: z.object({
        id: z.number().title('User ID').describe('Odoo user ID associated with the configured API key.'),
      }),
    },
  },
  getContactFields: {
    title: 'Get Odoo Contact Fields',
    description: 'Get available fields for Odoo contacts.',
    input: {
      schema: z.object({
        allfields: fieldsSchema.optional(),
        attributes: z
          .array(z.string())
          .title('Attributes')
          .describe('Field metadata attributes to return, such as string, type, and required.')
          .optional(),
        context: odooContextSchema.optional(),
      }),
    },
    output: {
      schema: z.object({
        fields: z.record(z.string(), z.unknown()).title('Fields').describe('Field metadata keyed by Odoo field name.'),
      }),
    },
  },
  searchContacts: {
    title: 'Search Contacts',
    description: 'Search Odoo contacts using an Odoo domain and optional read parameters.',
    input: {
      schema: z.object({
        domain: odooDomainSchema.optional(),
        fields: fieldsSchema.optional(),
        offset: z.number().title('Offset').describe('Number of matching contacts to skip.').optional(),
        limit: z.number().title('Limit').describe('Maximum number of contacts to return.').optional(),
        order: z.string().title('Order').describe('Odoo order expression, such as "name asc".').optional(),
        context: odooContextSchema.optional(),
      }),
    },
    output: {
      schema: z.object({
        records: z.array(odooRecordSchema).title('Records').describe('Matching Odoo contact records.'),
      }),
    },
  },
  getContacts: {
    title: 'Get Contacts',
    description: 'Read Odoo contacts by ID.',
    input: {
      schema: z.object({
        ids: contactIdsSchema,
        fields: fieldsSchema.optional(),
        context: odooContextSchema.optional(),
      }),
    },
    output: {
      schema: z.object({
        records: z.array(odooRecordSchema).title('Records').describe('Requested Odoo contact records.'),
      }),
    },
  },
  createContact: {
    title: 'Create Contact',
    description: 'Create an Odoo contact.',
    input: {
      schema: z.object({
        values: odooRecordSchema,
        context: odooContextSchema.optional(),
      }),
    },
    output: {
      schema: z.object({
        id: z.number().title('Contact ID').describe('ID of the created Odoo contact.'),
      }),
    },
  },
  updateContacts: {
    title: 'Update Contacts',
    description: 'Update one or more Odoo contacts.',
    input: {
      schema: z.object({
        ids: contactIdsSchema,
        values: odooRecordSchema,
        context: odooContextSchema.optional(),
      }),
    },
    output: {
      schema: z.object({
        success: z.boolean().title('Success').describe('Whether Odoo accepted the contact update.'),
      }),
    },
  },
  deleteContacts: {
    title: 'Delete Contacts',
    description: 'Delete one or more Odoo contacts owned by the specified Odoo user.',
    input: {
      schema: z.object({
        ids: contactIdsSchema,
        ownerId: z
          .number()
          .title('Owner User ID')
          .describe('Odoo user ID that must match each contact owner before the contact is deleted.'),
        context: odooContextSchema.optional(),
      }),
    },
    output: {
      schema: z.object({
        success: z.boolean().title('Success').describe('Whether all requested contacts were deleted.'),
        deletedIds: contactIdsSchema.describe('Odoo contact record IDs that were deleted.'),
        notDeletedContacts: z
          .array(notDeletedContactSchema)
          .title('Not Deleted Contacts')
          .describe('Odoo contacts that could not be deleted, with the reason for each contact.'),
      }),
    },
  },
} as const satisfies IntegrationDefinitionProps['actions']
