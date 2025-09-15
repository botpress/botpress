import { IntegrationDefinition, z } from '@botpress/sdk'
import { sendEnvelopeInputSchema, sendEnvelopeOutputSchema } from 'definitions/actions'

export default new IntegrationDefinition({
  name: 'docusign',
  title: 'Docusign',
  version: '2.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  description:
    'Automate document workflows, generate intelligent insights, enhance security measures, and improve user experience.',
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
    schema: z.object({}),
  },
  actions: {
    sendEnvelope: {
      title: 'Send Envelope',
      description: 'Sends an envelope (document) to a recipient to sign it',
      input: {
        schema: sendEnvelopeInputSchema,
      },
      output: {
        schema: sendEnvelopeOutputSchema,
      },
    },
  },
  secrets: {
    OAUTH_BASE_URL: {
      description: 'The base URL used for OAuth authentication',
    },
    OAUTH_CLIENT_ID: {
      description: "The unique identifier that's used to initiate the OAuth flow",
    },
    OAUTH_CLIENT_SECRET: {
      description: "A secret that's used to establish and refresh the OAuth authentication",
    },
  },
  states: {
    configuration: {
      type: 'integration',
      schema: z.object({
        oauth: z
          .object({
            baseUri: z.string().describe('The base URI for the Docusign API').title('Base URI'),
            refreshToken: z.string().describe('The refresh token for the integration').title('Refresh Token'),
            accessToken: z.string().describe('The access token for the integration').title('Access Token'),
            tokenType: z
              .string()
              .describe('The authentication header type for the access token (e.g. "Bearer")')
              .title('Token Type'),
            expiresAt: z
              .number()
              .min(0)
              .describe('The expiry time of the access token represented as a Unix timestamp (milliseconds)')
              .title('Expires At'),
          })
          .describe('The parameters used for accessing the Docusign API and refreshing the access token')
          .title('OAuth Parameters')
          .nullable(),
      }),
    },
  },
})
