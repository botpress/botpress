import * as sdk from '@botpress/sdk'
import { z } from '@botpress/sdk'

const Channels = ['pullRequest', 'issue'] as const

export type Target = {
  displayName: string
  tags: { [key: string]: string }
  channel: (typeof Channels)[number]
}

const findTarget = {
  input: {
    schema: z.object({
      query: z.string().title('Query').describe('The search query'),
      channel: z.enum(Channels).title('Channel').describe('The channel in which to execute the query'),
      repo: z.string().title('Repository').describe('The repository name'),
    }),
  },
  output: {
    schema: z.object({
      targets: z.array(
        z.object({
          displayName: z.string().title('Display Name').describe('The display name'),
          tags: z.record(z.string()).title('Tags').describe('The tags'),
          channel: z.enum(Channels).title('Channel').describe('The channel'),
        })
      ),
    }),
  },
}

export const actions = {
  findTarget,
} satisfies sdk.IntegrationDefinitionProps['actions']
