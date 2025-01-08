import { z, ZodRawShape } from '@botpress/sdk'
import * as sdk from '@botpress/sdk'

export { actions } from './actions'
export { events } from './events'
export { channels } from './channels'
import { multiLineString } from './zui'

export const configuration = {
  identifier: {
    linkTemplateScript: 'linkTemplate.vrl',
    required: true,
  },
  schema: z.object({}),
} as const satisfies sdk.IntegrationDefinitionProps['configuration']

const webhookSecret = {
  githubWebhookSecret: z
    .string()
    .min(1)
    .secret()
    .title('GitHub Webhook Secret')
    .describe(
      'A high-entropy string that only you and Botpress know. Must be set to the same value as in the GitHub organization settings.'
    ),
} as const satisfies ZodRawShape

export const configurations = {
  manualApp: {
    title: 'Manual configuration',
    description: 'Configure manually with your own GitHub App',
    schema: z.object({
      githubAppId: z
        .string()
        .min(1)
        .title('GitHub App ID')
        .describe('Can be found in the GitHub App settings. OAuth apps are not supported.'),
      githubAppPrivateKey: multiLineString
        .min(1)
        .secret()
        .title('GitHub App Private Key')
        .describe('The raw contents of the RSA private key. Can be downloaded from the GitHub App settings.')
        .placeholder('-----BEGIN RSA PRIVATE KEY-----\n\n...\n\n-----END RSA PRIVATE KEY-----'),
      githubAppInstallationId: z
        .number()
        .positive()
        .title('GitHub App Installation ID')
        .describe('Please refer to the integration documentation for details on how to obtain this.'),
      ...webhookSecret,
    }),
  },
  manualPAT: {
    title: 'Manual configuration',
    description: 'Configure manually with a Personal Access Token',
    schema: z.object({
      personalAccessToken: z
        .string()
        .min(1)
        .secret()
        .title('Personal Access Token')
        .describe('An organization-level GitHub Personal Access Token with the necessary permissions.'),
      ...webhookSecret,
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['configurations']

export const user = {
  tags: {
    handle: {
      title: 'GitHub Handle',
      description: 'The GitHub handle of the user',
    },
    id: {
      title: 'GitHub User ID',
      description: 'The GitHub ID of the user',
    },
    nodeId: {
      title: 'GitHub User Node ID',
      description: 'The GraphQL Node ID of the user',
    },
    profileUrl: {
      title: 'GitHub Profile URL',
      description: "The URL of the user's profile",
    },
  },
} satisfies sdk.IntegrationDefinitionProps['user']

export const states = {
  configuration: {
    type: 'integration',
    schema: z.object({
      githubInstallationId: z
        .number()
        .positive()
        .optional()
        .title('GitHub Installation ID')
        .describe('The ID of the GitHub installation'),
      organizationHandle: z
        .string()
        .optional()
        .title('Organization Handle')
        .describe('The handle of the organization that owns the repositories'),
    }),
  },
} satisfies sdk.IntegrationDefinitionProps['states']

export const secrets: sdk.IntegrationDefinitionProps['secrets'] = {
  GITHUB_APP_ID: {
    description: 'GitHub App ID for the Botpress GitHub App. This is not the client id',
  },
  GITHUB_PRIVATE_KEY: {
    description: 'GitHub App RSA Private Key. Should be the full contents of the private key file',
  },
  GITHUB_WEBHOOK_SECRET: {
    description: 'GitHub Webhook Secret. Should be a high-entropy string that only Botpress knows',
  },
}
