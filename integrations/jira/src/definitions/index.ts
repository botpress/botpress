import { z, type IntegrationDefinitionProps } from '@botpress/sdk'

export { actions } from './actions'
export { channels } from './channels'

export const configuration = {
  identifier: {
    linkTemplateScript: 'linkTemplate.vrl',
  },
  schema: z.object({}),
} satisfies IntegrationDefinitionProps['configuration']

export const states = {
  oAuthCredentials: {
    type: 'integration',
    schema: z.object({
      accessToken: z.string().secret().describe('The Atlassian OAuth access token'),
      refreshToken: z.string().secret().describe('The rotating Atlassian OAuth refresh token'),
      expiresAt: z.string().datetime().describe('The timestamp of when the access token expires'),
      scopes: z.array(z.string()).describe('The scopes granted to the token'),
    }),
  },
  manualCredentials: {
    type: 'integration',
    schema: z.object({
      host: z.string().url().describe('Jira Cloud host URL, such as https://example.atlassian.net'),
      email: z.string().email().describe('Atlassian account email used for Jira API authentication'),
      apiToken: z.string().secret().describe('Atlassian API token used for Jira API authentication'),
    }),
  },
  oauthSession: {
    type: 'integration',
    schema: z.object({
      state: z.string().describe('The OAuth state paired with the in-flight authorization request'),
      createdAt: z.string().datetime().describe('The timestamp of when the OAuth state was issued'),
    }),
  },
  configuration: {
    type: 'integration',
    schema: z.object({
      authType: z.enum(['oauth', 'manual']).describe('The Jira authentication mode'),
      host: z.string().url().describe('The selected Jira Cloud host URL'),
      cloudId: z.string().optional().describe('The selected Atlassian cloud ID for OAuth requests'),
    }),
  },
} satisfies IntegrationDefinitionProps['states']

export const secrets = {
  CLIENT_ID: {
    description: 'The client ID of the Atlassian OAuth app.',
  },
  CLIENT_SECRET: {
    description: 'The client secret of the Atlassian OAuth app.',
  },
} satisfies IntegrationDefinitionProps['secrets']

export const user = {
  tags: {},
} satisfies IntegrationDefinitionProps['user']
