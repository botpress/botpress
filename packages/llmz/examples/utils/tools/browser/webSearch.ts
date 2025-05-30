import { type Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { Tool } from 'llmz'

/** Search information on the web. You need to browse to that page to get the full content of the page. */
export const webSearch = (client: Client) =>
  new Tool({
    name: 'browser_webSearch',
    description: 'Search information on the web. You need to browse to that page to get the full content of the page.',
    input: z
      .object({
        query: z.string().min(1, undefined).max(1000, undefined).describe('What are we searching for?'),
        includeSites: z
          .optional(
            z
              .array(
                z
                  .string()
                  .regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/, undefined)
                  .min(3, undefined)
                  .max(50, undefined)
              )
              .max(20, undefined)
              .describe('Include only these domains in the search (max 20)')
          )
          .describe('Include only these domains in the search (max 20)'),
        excludeSites: z
          .optional(
            z
              .array(
                z
                  .string()
                  .regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/, undefined)
                  .min(3, undefined)
                  .max(50, undefined)
              )
              .max(20, undefined)
              .describe('Exclude these domains from the search (max 20)')
          )
          .describe('Exclude these domains from the search (max 20)'),
        count: z
          .default(
            z
              .number()
              .min(1, undefined)
              .max(20, undefined)
              .describe('Number of search results to return (default: 10)'),
            10
          )
          .describe('Number of search results to return (default: 10)'),
        freshness: z
          .optional(z.enum(['Day', 'Week', 'Month']).describe('Only consider results from the last day, week or month'))
          .describe('Only consider results from the last day, week or month'),
        browsePages: z

          .boolean()
          // .default(false)
          .describe('Whether to browse to the pages to get the full content'),
      })
      .catchall(z.never()),
    output: z
      .object({
        results: z.array(
          z
            .object({
              name: z.string().describe('Title of the page'),
              url: z.string().describe('URL of the page'),
              snippet: z.string().describe('A short summary of the page'),
              links: z
                .optional(
                  z
                    .array(
                      z
                        .object({
                          name: z.string(),
                          url: z.string(),
                        })
                        .catchall(z.never())
                    )
                    .describe('Useful links on the page')
                )
                .describe('Useful links on the page'),
              page: z.optional(
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
            .catchall(z.never())
        ),
      })
      .catchall(z.never()),
    handler: async (input) => {
      return client.callAction({ type: 'browser:webSearch', input }).then(({ output }) => output) as any
    },
  })
