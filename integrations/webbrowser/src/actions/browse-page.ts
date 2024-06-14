import axios from 'axios'
import * as bp from '.botpress'

type ExtractedContent = {
  content: string
  metadata: {
    title?: string | null
    description?: string | null
    author?: string | null
    favicon?: string | null
    datePublished?: string | null
  }
}

export const browsePage: bp.IntegrationProps['actions']['browsePage'] = async ({ input, logger }) => {
  logger.forBot().debug('Browsing Page', { input })

  try {
    const { data } = await axios.post<ExtractedContent>(
      'https://studio.botpress.dev/documents/extract-content',
      { url: input.url },
      {
        headers: {
          'x-api-key': bp.secrets.EXTRACT_CONTENT_KEY,
        },
      }
    )

    return data
  } catch (err) {
    logger.forBot().error('There was an error while browsing the page.', err)
    throw err
  }
}
