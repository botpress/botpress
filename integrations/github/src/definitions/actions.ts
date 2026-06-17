import * as sdk from '@botpress/sdk'
import { z } from '@botpress/sdk'

const Channels = ['pullRequest', 'issue'] as const

export type Target = {
  displayName: string
  tags: { [key: string]: string }
  channel: (typeof Channels)[number]
}
export const actions = {
  findTarget: {
    title: 'Find Target',
    description: 'List open pull requests or issues in a repository (optionally filtered by a title search).',
    input: {
      schema: z.object({
        query: z
          .string()
          .optional()
          .title('Query')
          .describe(
            'Optional fuzzy filter applied to the "<number> - <title>" of each open PR/issue. Leave empty to return all open items. This is NOT GitHub search syntax — qualifiers like "is:open", "author:x", or "state:open" will match nothing.'
          ),
        channel: z.enum(Channels).title('Channel').describe('The channel of the target'),
        repo: z
          .string()
          .title('Repository')
          .describe(
            'The repository name, optionally including the owner as "owner/repo" (e.g. "botpress/botpress"). If the owner is omitted, the owner of the connected installation is used. The repository must belong to the account the GitHub App is installed on.'
          ),
      }),
    },
    output: {
      schema: z.object({
        targets: z
          .array(
            z.object({
              displayName: z.string().title('Display Name').describe('The display name'),
              tags: z.record(z.string()).title('Tags').describe('The tags associated with the target'),
              channel: z.enum(Channels).title('Channel').describe('The channel of the target'),
            })
          )
          .title('Targets')
          .describe('The list of received target'),
      }),
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['actions']
