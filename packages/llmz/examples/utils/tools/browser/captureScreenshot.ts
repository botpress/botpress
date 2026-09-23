import { type Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { Tool } from 'llmz'

/** Capture a screenshot of the specified page. */
export const captureScreenshot = (client: Client) =>
  new Tool({
    name: 'browser_captureScreenshot',
    description: 'Capture a screenshot of the specified page.',
    input: z
      .object({
        url: z.string(),
      })
      .catchall(z.never()),
    output: z
      .object({
        imageUrl: z.string(),
      })
      .catchall(z.never()),
    handler: async (input) => {
      return client.callAction({ type: 'browser:captureScreenshot', input }).then(({ output }) => output) as any
    },
  })
