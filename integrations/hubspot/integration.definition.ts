import { IntegrationDefinition, z } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'hubspot',
  title: 'Hubspot',
  description: 'Manage contacts, tickets and more from your chatbot.',
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({}),
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
      required: true,
    },
  },
  configurations: {
    manual: {
      title: 'Manual Configuration',
      description: 'Manual configuration, use your own Hubspot app',
      schema: z.object({
        accessToken: z.string().min(1).title('Access Token').describe('Your Hubspot Access Token'),
      }),
    },
  },
  actions: {
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
