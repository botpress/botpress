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
      query: z.string(),
      channel: z.enum(Channels),
      repo: z.string().title('Repository').describe('The repository name'),
    }),
  },
  output: {
    schema: z.object({
      targets: z.array(
        z.object({
          displayName: z.string(),
          tags: z.record(z.string()),
          channel: z.enum(Channels),
        })
      ),
    }),
  },
}

export const actions = {
  findTarget,
} satisfies sdk.IntegrationDefinitionProps['actions']
