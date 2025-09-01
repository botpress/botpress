import { IntegrationDefinition, z } from '@botpress/sdk'
import { contactActions, ticketActions } from './definitions'

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
    ...contactActions,
    ...ticketActions,
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
