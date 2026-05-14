import { z, type IntegrationDefinitionProps } from '@botpress/sdk'

export { actions } from './actions'
export { channels } from './channels'

export const configuration = {
  schema: z.object({
    host: z.string().url().title('Host URL').describe('Jira Cloud host URL, such as https://example.atlassian.net'),
    email: z.string().email().title('Email').describe('Atlassian account email used for Jira API authentication'),
    apiToken: z
      .string()
      .min(1)
      .secret()
      .title('API Token')
      .describe('Atlassian API token used for Jira API authentication'),
  }),
} satisfies IntegrationDefinitionProps['configuration']

export const states = {} satisfies IntegrationDefinitionProps['states']

export const user = {
  tags: {},
} satisfies IntegrationDefinitionProps['user']
