/* bplint-disable */
import { posthogHelper } from '@botpress/common'
import { IntegrationDefinition, z } from '@botpress/sdk'
import { actions, events, subdomain } from './definitions'

export const INTEGRATION_NAME = 'bamboohr'
export const INTEGRATION_VERSION = '2.0.1'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: INTEGRATION_VERSION,
  title: 'BambooHR',
  description: 'Retrieve your BambooHR information',
  readme: 'hub.md',
  icon: 'icon.svg',

  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
      required: true,
    },
    schema: z.object({}),
  },

  configurations: {
    manual: {
      title: 'Manual configuration',
      description: 'Configure manually with your BambooHR API Key',
      schema: z.object({
        apiKey: z.string().min(1).title('API Key').describe('Your BambooHR API Key, from My Account > Api Keys'),
        subdomain,
      }),
    },
  },
  actions,
  events,
  secrets: {
    OAUTH_CLIENT_SECRET: {
      description: 'The OAuth Client Secret provided by BambooHR from the developer portal.',
    },
    OAUTH_CLIENT_ID: {
      description: 'The OAuth Client ID provided by BambooHR from the developer portal.',
    },
    ...posthogHelper.COMMON_SECRET_NAMES,
  },
  states: {
    oauth: {
      type: 'integration',
      schema: z
        .object({
          domain: z.string().title('Domain').describe('The domain of the company.'),
          accessToken: z.string().title('Temporary Access Token').describe('Temporary access token for the API.'),
          refreshToken: z.string().title('Refresh Token').describe('Token used to refresh the access token.'),
          expiresAt: z
            .number()
            .title('Expiration Timestamp')
            .describe('Timestamp (in ms from epoch) at which the token expires.'),
          scopes: z.string().title('Scopes').describe('Scopes for the token (space-separated).'),
        })
        .title('OAuth Parameters')
        .describe('Parameters required to authenticate via OAuth. Not required if using API Key.'),
    },
    webhook: {
      type: 'integration',
      schema: z.object({
        privateKey: z
          .string()
          .nullable()
          .title('Private Key')
          .describe('The private key provided by BambooHR to validate the webhook.'),
        id: z
          .string()
          .nullable()
          .title('Webhook ID')
          .describe('The ID of the webhook as provided by BambooHR when the webhook was created.'),
      }),
    },
  },
})
