import { convertMarkdownToHtml, fromHtmlFunction } from './util'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    fromHtml: async ({ client, input, logger }) => {
      const { html, filename = 'generated.pdf' } = input
      return fromHtmlFunction(client, html, filename, logger)
    },
    fromMarkdown: async ({ client, input, logger }) => {
      try {
        logger.forBot().info('Converting markdown to PDF')
        const { markdown, filename = 'generated.pdf' } = input

        // Convert markdown to HTML
        const html = await convertMarkdownToHtml(markdown)

        // Reuse the fromHtml function
        return fromHtmlFunction(client, html, filename, logger)
      } catch (error) {
        logger.forBot().error('Failed to convert markdown to PDF: ' + error)
        throw error
      }
    },
  },
  channels: {},
  handler: async () => {},
})
