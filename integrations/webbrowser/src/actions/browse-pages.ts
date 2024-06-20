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

const getPageContent = async (url: string) => {
  const { data } = await axios.post<ExtractedContent>(
    'https://studio.botpress.dev/documents/extract-content',
    { url },
    {
      headers: {
        'x-api-key': bp.secrets.EXTRACT_CONTENT_KEY,
      },
    }
  )

  return { ...data, url }
}

export const browsePages: bp.IntegrationProps['actions']['browsePages'] = async ({ input, logger }) => {
  logger.forBot().debug('Browsing Pages', { input })

  try {
    const results = await Promise.all(input.urls.map(async (url) => getPageContent(url)))
    return { results }
  } catch (err) {
    logger.forBot().error('There was an error while browsing the page.', err)
    throw err
  }
}
