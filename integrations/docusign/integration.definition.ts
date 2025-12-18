import { IntegrationDefinition, z } from '@botpress/sdk'
import { sendEnvelopeInputSchema, sendEnvelopeOutputSchema } from 'definitions/actions'
import { configurationSchema } from 'definitions/configuration'
import { envelopeEventSchema } from 'definitions/events'

export default new IntegrationDefinition({
  name: 'docusign',
  title: 'Docusign',
  version: '2.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  description:
    'Automate document workflows, generate intelligent insights, enhance security measures, and improve user experience.',
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
    schema: configurationSchema,
  },
  configurations: {
    sandbox: {
      title: 'Sandbox',
      description: 'Use Docusign developer sandbox environment',
      identifier: {
        linkTemplateScript: 'linkTemplateSandbox.vrl',
      },
      schema: configurationSchema,
    },
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
  events: {
    envelopeSent: {
      title: 'Envelope Sent',
      description: 'An event that triggers when an envelope is sent to the recipient(s) to be signed',
      schema: envelopeEventSchema,
    },
    envelopeResent: {
      title: 'Envelope Resent',
      description: 'An event that triggers when an envelope is resent to the recipient(s) via the dashboard',
      schema: envelopeEventSchema,
    },
    envelopeCompleted: {
      title: 'Envelope Completed',
      description: 'An event that triggers when an envelope has been completed/signed by all recipient(s)',
      schema: envelopeEventSchema,
    },
    envelopeDeclined: {
      title: 'Envelope Declined',
      description: 'An event that triggers when a recipient has declined to sign an envelope',
      schema: envelopeEventSchema,
    },
    envelopeVoided: {
      title: 'Envelope Voided',
      description: 'An event that triggers when an envelope has been voided by the sender',
      schema: envelopeEventSchema,
    },
  },
  secrets: {
    OAUTH_BASE_URL: {
      description: 'The base URL used for OAuth authentication',
    },
    CLIENT_ID: {
      description: "The unique identifier that's used to initiate the OAuth flow",
    },
    CLIENT_SECRET: {
      description: "A secret that's used to establish and refresh the OAuth authentication",
    },
    SANDBOX_OAUTH_BASE_URL: {
      description: 'The base URL used for OAuth authentication',
    },
    SANDBOX_CLIENT_ID: {
      description: "The unique identifier that's used to initiate the OAuth flow",
    },
    SANDBOX_CLIENT_SECRET: {
      description: "A secret that's used to establish and refresh the OAuth authentication",
    },
    WEBHOOK_SIGNING_SECRET: {
      description: "The signing key used to validate Docusign's webhook request payloads",
    },
  },
  states: {
    configuration: {
      type: 'integration',
      schema: z.object({
        oauth: z
          .object({
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
    account: {
      type: 'integration',
      schema: z.object({
        account: z
          .object({
            id: z.string().title('API Account ID').describe("The docusign user's api account id"),
            baseUri: z.string().describe('The base URI for the Docusign API').title('Base URI'),
            refreshAt: z
              .number()
              .min(0)
              .title('Refresh At')
              .describe(
                'The unix timestamp (milliseconds) that the selected account will be refreshed (Only when not explicitly selected in the config)'
              )
              .nullable(),
          })
          .title('Account Info')
          .describe("The docusign account's info")
          .nullable(),
      }),
    },
  },
})
