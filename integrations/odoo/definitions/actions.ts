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
const leadIdsSchema = z.array(z.number()).title('Lead IDs').describe('Odoo CRM lead record IDs.')

const leadValuesSchema = z
  .object({
    name: z.string().title('Name').describe('Lead or opportunity title.'),
    email_from: z.string().title('Email').describe('Lead email address.').optional(),
    phone: z.string().title('Phone').describe('Lead phone number.').optional(),
    mobile: z.string().title('Mobile').describe('Lead mobile phone number.').optional(),
    contact_name: z.string().title('Contact Name').describe('Name of the person associated with the lead.').optional(),
    partner_name: z.string().title('Company Name').describe('Company name associated with the lead.').optional(),
    partner_id: z.number().title('Customer ID').describe('Related Odoo customer/contact ID.').optional(),
    stage_id: z.number().title('Stage ID').describe('Odoo CRM stage ID.').optional(),
    user_id: z.number().title('Salesperson ID').describe('Assigned Odoo user ID.').optional(),
    team_id: z.number().title('Sales Team ID').describe('Assigned Odoo sales team ID.').optional(),
    type: z
      .enum(['lead', 'opportunity'])
      .title('Type')
      .describe('Whether the CRM record is a lead or opportunity.')
      .optional(),
    probability: z.number().title('Probability').describe('Success probability percentage.').optional(),
    expected_revenue: z.number().title('Expected Revenue').describe('Expected revenue for the opportunity.').optional(),
    description: z.string().title('Description').describe('Internal notes or description for the lead.').optional(),
    referred: z.string().title('Referred By').describe('Referral source text.').optional(),
    source_id: z.number().title('Source ID').describe('Odoo UTM source ID.').optional(),
    medium_id: z.number().title('Medium ID').describe('Odoo UTM medium ID.').optional(),
    campaign_id: z.number().title('Campaign ID').describe('Odoo UTM campaign ID.').optional(),
  })
  .passthrough()
  .title('Lead Values')
  .describe('Odoo CRM lead field values keyed by field name.')

const leadUpdateValuesSchema = leadValuesSchema
  .partial()
  .title('Lead Values')
  .describe('Odoo CRM lead field values to update, keyed by field name.')

const notDeletedContactSchema = z
  .object({
    id: z.number().title('Contact ID').describe('Odoo contact record ID.'),
    name: z.string().title('Contact Name').describe('Odoo contact display name.').optional(),
    reason: z.string().title('Reason').describe('Why the contact could not be deleted.'),
  })
  .title('Not Deleted Contact')
  .describe('An Odoo contact that could not be deleted.')

const notDeletedLeadSchema = z
  .object({
    id: z.number().title('Lead ID').describe('Odoo CRM lead record ID.'),
    name: z.string().title('Lead Name').describe('Odoo CRM lead display name.').optional(),
    reason: z.string().title('Reason').describe('Why the lead could not be deleted.'),
  })
  .title('Not Deleted Lead')
  .describe('An Odoo CRM lead that could not be deleted.')

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
  getLeadFields: {
    title: 'Get Odoo Lead Fields',
    description: 'Get available fields for Odoo CRM leads.',
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
          .describe('Field metadata keyed by Odoo lead field name.'),
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
  searchLeads: {
    title: 'Search Leads',
    description: 'Search Odoo CRM leads using an Odoo domain and optional read parameters.',
    input: {
      schema: z.object({
        domain: odooDomainSchema.optional(),
        fields: fieldsSchema.optional(),
        offset: z.number().title('Offset').describe('Number of matching leads to skip.').optional(),
        limit: z.number().title('Limit').describe('Maximum number of leads to return.').optional(),
        order: z.string().title('Order').describe('Odoo order expression, such as "name asc".').optional(),
        context: odooContextSchema.optional(),
      }),
    },
    output: {
      schema: z.object({
        records: z.array(odooRecordSchema).title('Records').describe('Matching Odoo CRM lead records.'),
      }),
    },
  },
  getLeads: {
    title: 'Get Leads',
    description: 'Read Odoo CRM leads by ID.',
    input: {
      schema: z.object({
        ids: leadIdsSchema,
        fields: fieldsSchema.optional(),
        context: odooContextSchema.optional(),
      }),
    },
    output: {
      schema: z.object({
        records: z.array(odooRecordSchema).title('Records').describe('Requested Odoo CRM lead records.'),
      }),
    },
  },
  createLead: {
    title: 'Create Lead',
    description: 'Create an Odoo CRM lead or opportunity.',
    input: {
      schema: z.object({
        values: leadValuesSchema,
        context: odooContextSchema.optional(),
      }),
    },
    output: {
      schema: z.object({
        id: z.number().title('Lead ID').describe('ID of the created Odoo CRM lead.'),
      }),
    },
  },
  updateLeads: {
    title: 'Update Leads',
    description: 'Update one or more Odoo CRM leads.',
    input: {
      schema: z.object({
        ids: leadIdsSchema,
        values: leadUpdateValuesSchema,
        context: odooContextSchema.optional(),
      }),
    },
    output: {
      schema: z.object({
        success: z.boolean().title('Success').describe('Whether Odoo accepted the lead update.'),
      }),
    },
  },
  deleteLeads: {
    title: 'Delete Leads',
    description: 'Delete one or more Odoo CRM leads owned by the specified Odoo user.',
    input: {
      schema: z.object({
        ids: leadIdsSchema,
        ownerId: z
          .number()
          .title('Owner User ID')
          .describe('Odoo user ID that must match each lead owner before the lead is deleted.'),
        context: odooContextSchema.optional(),
      }),
    },
    output: {
      schema: z.object({
        success: z.boolean().title('Success').describe('Whether all requested leads were deleted.'),
        deletedIds: leadIdsSchema.describe('Odoo CRM lead record IDs that were deleted.'),
        notDeletedLeads: z
          .array(notDeletedLeadSchema)
          .title('Not Deleted Leads')
          .describe('Odoo CRM leads that could not be deleted, with the reason for each lead.'),
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
