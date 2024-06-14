import { z } from '@botpress/sdk'

const captureScreenshot = {
  title: 'Capture Screenshot',
  description: 'Capture a screenshot of the specified page.',
  input: {
    schema: z.object({
      url: z.string(),
    }),
  },
  output: {
    schema: z.object({
      imageUrl: z.string(),
    }),
  },
}

const browsePage = {
  title: 'Browse Page',
  description: 'Extract metadata and content of the specified page as markdown.',
  input: {
    schema: z.object({
      url: z.string(),
    }),
  },
  output: {
    schema: z.object({
      content: z.string(),
      metadata: z.object({
        title: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        favicon: z.string().nullable().optional(),
        author: z.string().nullable().optional(),
        datePublished: z.string().nullable().optional(),
      }),
    }),
  },
}

export const actionDefinitions = {
  captureScreenshot,
  browsePage,
}
