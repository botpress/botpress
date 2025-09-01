import { IntegrationDefinition, z } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'hubspot',
  title: 'Hubspot',
  description: 'Manage contacts, tickets and more from your chatbot.',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({}),
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
      required: true,
    },
  },
  identifier: {
    extractScript: 'extract.vrl',
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
          .describe('Hubspot Client Secret used for webhook signature check'),
      }),
    },
  },
  actions: {
    searchLead: {
      title: 'Search Lead',
      description: 'Search for a lead in Hubspot',
      input: {
        schema: z.object({
          name: z.string().optional().title('Name').describe('The name of the lead to search for'),
          email: z.string().optional().title('Email').describe('The email of the lead to search for'),
          phone: z.string().optional().title('Phone').describe('The phone number of the contact to search for'),
        }),
      },
      output: {
        schema: z.object({
          lead: z
            .object({
              id: z.string().title('Lead ID').describe('The ID of the lead'),
            })
            .optional()
            .title('Lead')
            .describe('The lead found'),
        }),
      },
    },
    getLead: {
      title: 'Get Lead',
      description: 'Get a lead in Hubspot',
      input: {
        schema: z.object({
          id: z.string().title('Lead ID').describe('The ID of the lead to get'),
        }),
      },
      output: {
        schema: z.object({
          lead: z.object({
            id: z.string().title('Lead ID').describe('The ID of the lead'),
          }),
        }),
      },
    },
    // listLeads: {},
    // createLead: {},
    // updateLead: {},
    // deleteLead: {},
    // createDeal: {},
    // updateDeal: {},
    // deleteDeal: {},
    // listDeals: {},
    // searchDeal: {},
    // getDeal: {},
    searchContact: {
      title: 'Search Contact',
      description: 'Search for a contact in Hubspot',
      input: {
        schema: z.object({
          email: z.string().optional().title('Email').describe('The email of the contact to search for'),
          phone: z.string().optional().title('Phone').describe('The phone number of the contact to search for'),
          properties: z
            .array(z.string())
            .optional()
            .title('Property Names')
            .describe('The properties to include in the response'),
        }),
      },
      output: {
        schema: z.object({
          contact: z
            .object({
              id: z.string().title('Contact ID').describe('The ID of the contact'),
              properties: z.record(z.any()).title('Properties').describe('The properties of the contact'),
            })
            .optional()
            .title('Contact')
            .describe('The contact found'),
        }),
      },
    },
    createTicket: {
      title: 'Create Ticket',
      description: 'Create a ticket in Hubspot',
      input: {
        schema: z.object({
          subject: z.string().title('Ticket name').describe('Short summary of ticket'),
          category: z
            .enum(['Product Issue', 'Billing Issue', 'Feature Request', 'General Inquiry'])
            .optional()
            .title('Category')
            .describe('Main reason customer reached out for help'),
          description: z.string().optional().title('Ticket description').describe('Description of the ticket'),
          pipeline: z
            .string()
            .title('Pipeline')
            .describe('The pipeline that contains this ticket. Can be a name or internal ID'),
          pipelineStage: z
            .string()
            .title('Ticket status')
            .describe('The pipeline stage that contains this ticket. Can be a name or internal ID'),
          priority: z
            .enum(['Low', 'Medium', 'High', 'Urgent'])
            .optional()
            .title('Priority')
            .describe('The level of attention needed on the ticket'),
          ticketOwner: z
            .string()
            .optional()
            .title('Ticket owner')
            .describe('User the ticket is assigned to. Can be an email address or user ID'),
          linearTicketUrl: z.string().optional().title('Linear Ticket URL').describe('Link to the linear ticket'),
          source: z
            .enum(['Zoom', 'Email', 'Phone', 'Chat', 'Form'])
            .optional()
            .title('Source')
            .describe('The original source of the ticket'),
          additionalProperties: z
            .array(
              z.object({
                name: z.string().title('Property Name').describe('The name of the property'),
                value: z.string().title('Property Value').describe('The value of the property'),
              })
            )
            .title('Additional Properties')
            .describe('Additional ticket properties'),
        }),
      },
      output: {
        schema: z.object({
          ticketId: z.string().title('Ticket ID').describe('The ID of the created ticket'),
        }),
      },
    },
  },
  events: {
    contactCreated: {
      title: 'Contact Created',
      description: 'A new contact has been created in Hubspot.',
      schema: z.object({}),
    },
    contactUpdated: {
      title: 'Contact Updated',
      description: 'A contact has been updated in Hubspot.',
      schema: z.object({}),
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
  },
  secrets: {
    CLIENT_ID: {
      description: 'The client ID of the Hubspot app',
    },
    CLIENT_SECRET: {
      description: 'The client secret of the Hubspot app',
    },
  },
})
