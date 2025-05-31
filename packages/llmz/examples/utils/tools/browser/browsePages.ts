import { type Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { Tool } from 'llmz'

/** Extract the full content & the metadata of the specified pages as markdown. */
export const browsePages = (client: Client) =>
  new Tool({
    name: 'browser_browsePages',
    description: 'Extract the full content & the metadata of the specified pages as markdown.',
    input: z
      .object({
        urls: z.array(z.string()),
        waitFor: z
          .default(
            z
              .number()
              .describe(
                'Time to wait before extracting the content (in milliseconds). Set this value higher for dynamic pages.'
              ),
            350
          )
          .describe(
            'Time to wait before extracting the content (in milliseconds). Set this value higher for dynamic pages.'
          ),
      })
      .catchall(z.never()),
    output: z
      .object({
        results: z.array(
          z
            .object({
              url: z.string(),
              content: z.string(),
              favicon: z.optional(z.string()),
              title: z.optional(z.string()),
              description: z.optional(z.string()),
            })
            .catchall(z.never())
        ),
      })
      .catchall(z.never()),
    handler: async (input) => {
      return client.callAction({ type: 'browser:browsePages', input }).then(({ output }) => output) as any
    },
  })
