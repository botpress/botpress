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
    description: 'Find a target in a repository',
    input: {
      schema: z.object({
        query: z.string().title('Query').describe('The query used to find the target'),
        channel: z.enum(Channels).title('Channel').describe('The channel of the target'),
        repo: z.string().title('Repository').describe('The repository name'),
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
