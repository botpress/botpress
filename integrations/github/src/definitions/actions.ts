import * as sdk from '@botpress/sdk'
import { z } from '@botpress/sdk'

const channels = ['pullRequest', 'issue'] as const

export type Target = {
  displayName: string
  tags: { [key: string]: string }
  channel: (typeof channels)[number]
}

const findTarget = {
  title: 'Find Target',
  description: 'Find a target in a repository',
  input: {
    schema: z.object({
      query: z.string().title('Query').describe('The search query'),
      channel: z.enum(channels).title('Channel').describe('The channel in which to execute the query'),
      repo: z.string().title('Repository').describe('The repository name'),
      organization: z
        .string()
        .optional()
        .title('Organization')
        .describe(
          'The organization that owns the repository. Leave empty if the repository is owned by the current user.'
        ),
    }),
  },
  output: {
    schema: z.object({
      targets: z.array(
        z
          .object({
            displayName: z.string().title('Display Name').describe('The display name'),
            tags: z.record(z.string()).title('Tags').describe('The tags'),
            channel: z.enum(channels).title('Channel').describe('The channel'),
          })
          .title('Targets')
          .describe('The list of received targets')
      ),
    }),
  },
}

const findIssuesOrPullRequests = {
  ...findTarget,
  title: 'Find issues or pull requests',
  description: 'Find issues or pull requests in a repository',
}

const sendRawGraphqlQuery = {
  input: {
    schema: z.object({
      query: z.string().title('Query').describe('The GraphQL query'),
      parameters: z
        .array(
          z.object({
            name: z.string().title('Name').describe('The parameter name'),
            value: z.any().title('Value').describe('The parameter value'),
          })
        )
        .optional()
        .title('Parameters')
        .describe('The query parameters'),
    }),
  },
  output: {
    schema: z.object({
      result: z.unknown().title('Result').describe('The query result'),
    }),
  },
}

export const actions = {
  findTarget: { ...findTarget, attributes: { ...sdk.WELL_KNOWN_ATTRIBUTES.HIDDEN_IN_STUDIO } },
  findIssuesOrPullRequests,
  sendRawGraphqlQuery,
} satisfies sdk.IntegrationDefinitionProps['actions']
