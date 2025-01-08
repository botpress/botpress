/* bplint-disable */
import { IntegrationDefinition, z } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'pdf-generator',
  version: '0.0.2',
  readme: 'hub.md',
  icon: 'icon.svg',
  description: 'Converts markdown content to PDF using PDFShift',
  configuration: {
    schema: z.object({}),
  },
  actions: {
    fromMarkdown: {
      title: 'Markdown to PDF',
      description: 'Converts a markdown content to a PDF file',
      input: {
        schema: z.object({
          markdown: z.string().min(1).describe('The markdown content to convert to PDF'),
          filename: z
            .string()
            .min(1)
            .endsWith('.pdf')
            .describe('The filename of the PDF')
            .optional()
            .default('generated.pdf'),
        }),
      },
      output: {
        schema: z.object({
          fileId: z.string().describe('The generated PDF file ID'),
          fileUrl: z.string().describe('The public URL to download the PDF'),
        }),
      },
    },
    fromHtml: {
      title: 'HTML to PDF',
      description: 'Converts an HTML document to a PDF file',
      input: {
        schema: z.object({
          html: z.string().min(1).describe('The HTML content to convert to PDF'),
          filename: z
            .string()
            .min(1)
            .endsWith('.pdf')
            .describe('The filename of the PDF')
            .optional()
            .default('generated.pdf'),
        }),
      },
      output: {
        schema: z.object({
          fileId: z.string().describe('The generated PDF file ID'),
          fileUrl: z.string().describe('The public URL to download the PDF'),
        }),
      },
    },
  },
  secrets: {
    PDFSHIFT_API_KEY: {
      description: 'The API key to use PDFShift (https://app.pdfshift.io/env/apikeys)',
    },
  },
})
