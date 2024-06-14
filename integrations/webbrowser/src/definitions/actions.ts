import { z } from '@botpress/sdk'

const captureScreenshot = {
  input: {
    schema: z.object({
      url: z.string()
    })
  },
  output: {
    schema: z.object({
      imageUrl: z.string()
    })
  }
}

const browsePage = {
  input: {
    schema: z.object({
      url: z.string()
    })
  },
  output: {
    schema: z.object({
      content: z.string(),
      metadata: z.object({
        title: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        favicon: z.string().nullable().optional(),
        author: z.string().nullable().optional(),
        datePublished: z.string().nullable().optional()
      })
    })
  }
}

export const actionDefinitions = {
  captureScreenshot,
  browsePage
}
