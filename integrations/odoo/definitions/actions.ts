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

const fieldsSchema = z
  .array(z.string())
  .title('Fields')
  .describe('Odoo technical field names to include in the response. Only use fields known to exist on the target Odoo model.')
const contactFieldsSchema = fieldsSchema.describe(
  'Odoo res.partner field names to include in the response. Call listContactFields before choosing fields unless the exact field names were already retrieved in this conversation. Do not request CRM lead fields here; use searchLeads or listLeadFields for crm.lead fields.'
)
const leadFieldsSchema = fieldsSchema.describe(
  'Odoo crm.lead field names to include in the response. Call listLeadFields before choosing fields unless the exact field names were already retrieved in this conversation. To find which contacts are also leads, first retrieve the available contact and lead fields, then read comparable fields.'
)
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
  listContactFields: {
    title: 'List Odoo Contact Fields',
    description:
      'List available fields for Odoo contacts. Call this before searchContacts, listContacts, createContact, or updateContacts when selecting Odoo contact field names.',
    input: {
      schema: z.object({
        allfields: contactFieldsSchema.optional(),
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
  listLeadFields: {
    title: 'List Odoo Lead Fields',
    description:
      'List available fields for Odoo CRM leads. Call this before searchLeads, listLeads, createLead, or updateLeads when selecting Odoo lead field names.',
    input: {
      schema: z.object({
        allfields: leadFieldsSchema.optional(),
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
    description:
      'Search Odoo contacts using an Odoo domain and optional read parameters. Call listContactFields first unless the needed res.partner field names were already retrieved in this conversation.',
    input: {
      schema: z.object({
        domain: odooDomainSchema.optional(),
        fields: contactFieldsSchema.optional(),
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
    description:
      'Search Odoo CRM leads using an Odoo domain and optional read parameters. Call listLeadFields first unless the needed crm.lead field names were already retrieved in this conversation.',
    input: {
      schema: z.object({
        domain: odooDomainSchema.optional(),
        fields: leadFieldsSchema.optional(),
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
  listLeads: {
    title: 'List Leads',
    description:
      'Read Odoo CRM leads by ID. Call listLeadFields first unless the needed crm.lead field names were already retrieved in this conversation.',
    input: {
      schema: z.object({
        ids: leadIdsSchema,
        fields: leadFieldsSchema.optional(),
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
    description:
      'Create an Odoo CRM lead or opportunity. Call listLeadFields first unless the needed crm.lead field names were already retrieved in this conversation.',
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
    description:
      'Update one or more Odoo CRM leads. Call listLeadFields first unless the needed crm.lead field names were already retrieved in this conversation.',
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
        message: z.string().title('Message').describe('Summary of which requested leads were deleted or not deleted.'),
        deletedIds: leadIdsSchema.describe('Odoo CRM lead record IDs that were deleted.'),
        notDeletedLeads: z
          .array(notDeletedLeadSchema)
          .title('Not Deleted Leads')
          .describe('Odoo CRM leads that could not be deleted, with the reason for each lead.'),
      }),
    },
  },
  listContacts: {
    title: 'List Contacts',
    description:
      'Read Odoo contacts by ID. Call listContactFields first unless the needed res.partner field names were already retrieved in this conversation.',
    input: {
      schema: z.object({
        ids: contactIdsSchema,
        fields: contactFieldsSchema.optional(),
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
    description:
      'Create an Odoo contact. Call listContactFields first unless the needed res.partner field names were already retrieved in this conversation.',
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
    description:
      'Update one or more Odoo contacts. Call listContactFields first unless the needed res.partner field names were already retrieved in this conversation.',
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
        message: z.string().title('Message').describe('Summary of which requested contacts were deleted or not deleted.'),
        deletedIds: contactIdsSchema.describe('Odoo contact record IDs that were deleted.'),
        notDeletedContacts: z
          .array(notDeletedContactSchema)
          .title('Not Deleted Contacts')
          .describe('Odoo contacts that could not be deleted, with the reason for each contact.'),
      }),
    },
  },
} as const satisfies IntegrationDefinitionProps['actions']
