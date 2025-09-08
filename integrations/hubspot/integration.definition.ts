import { IntegrationDefinition, z } from '@botpress/sdk'
import { actions } from './definitions'

export default new IntegrationDefinition({
  name: 'hubspot',
  title: 'HubSpot',
  description: 'Manage contacts, tickets and more from your chatbot.',
  version: '2.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({}),
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
  },
  configurations: {
    manual: {
      title: 'Manual Configuration',
      description: 'Manual configuration, use your own Hubspot app',
      schema: z.object({
        accessToken: z.string().min(1).secret().title('Access Token').describe('Your Hubspot Access Token'),
        clientSecret: z
          .string()
          .secret()
          .optional()
          .title('Client Secret')
          .describe('Hubspot Client Secret (used for webhook signature check)'),
      }),
    },
  },
  identifier: {
    extractScript: 'extract.vrl',
  },
  actions,
  events: {
    contactCreated: {
      title: 'Contact Created',
      description: 'A new contact has been created in Hubspot.',
      schema: z.object({
        contactId: z.string().title('Contact ID').describe('The ID of the created contact'),
        name: z.string().optional().title('Name').describe('The name of the created contact'),
        email: z.string().optional().title('Email').describe('The email of the created contact'),
        phoneNumber: z.string().optional().title('Phone Number').describe('The phone number of the created contact'),
      }),
    },
    contactDeleted: {
      title: 'Contact Deleted',
      description: 'A contact has been deleted in Hubspot.',
      schema: z.object({
        contactId: z.string().title('Contact ID').describe('The ID of the deleted contact'),
      }),
    },
    companyCreated: {
      title: 'Company Created',
      description: 'A new company has been created in Hubspot.',
      schema: z.object({
        companyId: z.string().title('Company ID').describe('The ID of the created company'),
        name: z.string().optional().title('Name').describe('The name of the created company'),
        domain: z.string().optional().title('Domain').describe('The domain of the created company'),
        phoneNumber: z.string().optional().title('Phone Number').describe('The phone number of the created company'),
      }),
    },
    companyDeleted: {
      title: 'Company Deleted',
      description: 'A company has been deleted in Hubspot.',
      schema: z.object({
        companyId: z.string().title('Company ID').describe('The ID of the deleted company'),
      }),
    },
    ticketCreated: {
      title: 'Ticket Created',
      description: 'A new ticket has been created in Hubspot.',
      schema: z.object({
        ticketId: z.string().title('Ticket ID').describe('The ID of the created ticket'),
        subject: z.string().optional().title('Subject').describe('The subject of the created ticket'),
        priority: z.string().optional().title('Priority').describe('The priority of the created ticket'),
        category: z.string().optional().title('Category').describe('The category of the created ticket'),
        pipeline: z.string().title('Pipeline').describe('The pipeline of the created ticket'),
        stage: z.string().title('Stage').describe('The stage of the created ticket'),
      }),
    },
    ticketDeleted: {
      title: 'Ticket Deleted',
      description: 'A ticket has been deleted in Hubspot.',
      schema: z.object({
        ticketId: z.string().title('Ticket ID').describe('The ID of the deleted ticket'),
      }),
    },
  },
  states: {
    oauthCredentials: {
      type: 'integration',
      schema: z.object({
        accessToken: z.string().title('Access Token').describe('The access token for the Hubspot integration'),
        refreshToken: z.string().title('Refresh Token').describe('The refresh token for the Hubspot integration'),
        expiresAtSeconds: z
          .number()
          .title('Expires At')
          .describe('The timestamp in seconds when the access token expires'),
      }),
    },
    ticketPropertyCache: {
      type: 'integration',
      schema: z.object({
        properties: z
          .record(
            z.object({
              label: z.string().title('Label').describe('The label of the property'),
              type: z
                .enum(['bool', 'enumeration', 'date', 'datetime', 'string', 'number', 'object_coordinates', 'json'])
                .title('Type')
                .describe('The type of the property'),
              hubspotDefined: z
                .boolean()
                .title('Hubspot Defined')
                .describe('Whether the property is defined by Hubspot'),
            })
          )
          .title('Properties')
          .describe('A mapping or property names (string) to properties'),
      }),
    },
    ticketPipelineCache: {
      type: 'integration',
      schema: z.object({
        pipelines: z
          .record(
            z.object({
              label: z.string().title('Label').describe('The label of the pipeline'),
              stages: z
                .record(
                  z.object({
                    label: z.string().title('Label').describe('The label of the pipeline stage'),
                  })
                )
                .title('Stages')
                .describe('A mapping of pipeline stage ids (string) to pipeline stages'),
            })
          )
          .title('Pipelines')
          .describe('A mapping of pipeline ids (string) to pipelines'),
      }),
    },
    companiesCache: {
      type: 'integration',
      schema: z.object({
        companies: z
          .record(
            z.object({
              name: z.string().optional().title('Name').describe('The name of the company'),
              domain: z.string().optional().title('Domain').describe('The domain of the company'),
            })
          )
          .title('Companies')
          .describe('A mapping of company ids (string) to company details'),
      }),
    },
    contactPropertyCache: {
      type: 'integration',
      schema: z.object({
        properties: z
          .record(
            z.object({
              label: z.string().title('Label').describe('The label of the property'),
              type: z
                .enum([
                  'bool',
                  'enumeration',
                  'date',
                  'datetime',
                  'string',
                  'number',
                  'object_coordinates',
                  'json',
                  'phone_number',
                ])
                .title('Type')
                .describe('The type of the property'),
              hubspotDefined: z
                .boolean()
                .title('Hubspot Defined')
                .describe('Whether the property is defined by Hubspot'),
              options: z
                .array(z.string())
                .optional()
                .title('Options')
                .describe('The options of the property if it is an enumeration'),
            })
          )
          .title('Properties')
          .describe('A mapping of property names (string) to property details'),
      }),
    },
    dealPropertyCache: {
      type: 'integration',
      schema: z.object({
        properties: z
          .record(
            z.object({
              label: z.string().title('Label').describe('The label of the property'),
              type: z
                .enum([
                  'bool',
                  'enumeration',
                  'date',
                  'datetime',
                  'string',
                  'number',
                  'object_coordinates',
                  'json',
                  'phone_number',
                ])
                .title('Type')
                .describe('The type of the property'),
              hubspotDefined: z
                .boolean()
                .title('Hubspot Defined')
                .describe('Whether the property is defined by Hubspot'),
              options: z
                .array(z.string())
                .optional()
                .title('Options')
                .describe('The options of the property if it is an enumeration'),
            })
          )
          .title('Properties')
          .describe('A mapping of property names (string) to property details'),
      }),
    },
    leadPropertyCache: {
      type: 'integration',
      schema: z.object({
        properties: z
          .record(
            z.object({
              label: z.string().title('Label').describe('The label of the property'),
              type: z
                .enum([
                  'bool',
                  'enumeration',
                  'date',
                  'datetime',
                  'string',
                  'number',
                  'object_coordinates',
                  'json',
                  'phone_number',
                ])
                .title('Type')
                .describe('The type of the property'),
              hubspotDefined: z
                .boolean()
                .title('Hubspot Defined')
                .describe('Whether the property is defined by Hubspot'),
              options: z
                .array(z.string())
                .optional()
                .title('Options')
                .describe('The options of the property if it is an enumeration'),
            })
          )
          .title('Properties')
          .describe('A mapping of property names (string) to property details'),
      }),
    },
  },
  secrets: {
    CLIENT_ID: {
      description: 'The client ID of the Hubspot app',
    },
    CLIENT_SECRET: {
      description: 'The client secret of the Hubspot app',
    },
    DISABLE_OAUTH: {
      // TODO: Remove once the OAuth app allows for unlimited installs
      description: 'Whether to disable OAuth',
    },
  },
})
