import { z, IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'

const odooContextSchema = z
  .record(z.string(), z.unknown())
  .title('Context')
  .describe('Optional Odoo context values to pass with the request.')
const odooRecordSchema = z
  .record(z.string(), z.unknown())
  .title('Values')
  .describe('Odoo field values keyed by field name.')
const odooDomainConditionSchema = z.tuple([z.string(), z.string(), z.unknown()])
const odooDomainSchema = z
  .array(z.union([odooDomainConditionSchema, z.enum(['&', '|', '!'])]))
  .title('Domain')
  .describe('Odoo domain filters, such as [["id", "in", [1, 2, 3]]].')
const fieldsSchema = z.array(z.string()).title('Fields').describe('Odoo field names to include in the response.')
const contactIdsSchema = z.array(z.number()).title('Contact IDs').describe('Odoo contact record IDs.')

export default new IntegrationDefinition({
  name: integrationName,
  title: 'Odoo',
  description: 'Connect Botpress to Odoo records such as leads, contacts, and tickets.',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      url: z.string().url().title('Odoo URL').describe('Base URL of the Odoo instance.'),
      database: z.string().min(1).title('Database').describe('Odoo database name.'),
      apiKey: z.string().secret().min(1).title('API Key').describe('Odoo API key used to authenticate requests.'),
    }),
  },
  actions: {
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
          fields: z
            .record(z.string(), z.unknown())
            .title('Fields')
            .describe('Field metadata keyed by Odoo field name.'),
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
      description: 'Delete one or more Odoo contacts.',
      input: {
        schema: z.object({
          ids: contactIdsSchema,
          context: odooContextSchema.optional(),
        }),
      },
      output: {
        schema: z.object({
          success: z.boolean().title('Success').describe('Whether Odoo accepted the contact deletion.'),
        }),
      },
    },
  },
})
