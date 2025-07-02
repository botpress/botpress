import axios, { isAxiosError } from 'axios'
import * as bp from '.botpress'

const COST_PER_PAGE = 0.0015

export const captureScreenshot: bp.IntegrationProps['actions']['captureScreenshot'] = async ({
  input,
  logger,
  metadata,
  client,
}) => {
  logger.forBot().debug('Capturing Screenshot', { input })

  const qs = new URLSearchParams({
    url: input.url,
    width: Math.max(input.width || 1080, 320).toString(),
    height: Math.max(input.height || 1920, 240).toString(),
    full_page: input.fullPage ? 'true' : 'false',
    fresh: 'true',
    output: 'json',
    file_type: 'png',
    wait_for_event: 'load',
    extract_html: 'true',
    lazy_load: 'true',
    delay: '500',
  })

  if (input.javascriptToInject) {
    if (input.javascriptToInject.length > 100) {
      const { file: jsFile } = await client.uploadFile({
        key: `screenshot-js-${Date.now()}.js`,
        content: input.javascriptToInject,
        accessPolicies: ['public_content'],
        publicContentImmediatelyAccessible: true,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        index: false,
      })
      qs.append('js_url', jsFile.url)
    } else {
      qs.append('js', input.javascriptToInject)
    }
  }

  if (input.cssToInject) {
    if (input.cssToInject.length > 100) {
      const { file: cssFile } = await client.uploadFile({
        key: `screenshot-css-${Date.now()}.css`,
        content: input.cssToInject,
        accessPolicies: ['public_content'],
        publicContentImmediatelyAccessible: true,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        index: false,
      })
      qs.append('css_url', cssFile.url)
    } else {
      qs.append('css', input.cssToInject)
    }
  }

  const apiUrl = `https://shot.screenshotapi.net/screenshot?token=${bp.secrets.SCREENSHOT_API_KEY}&${qs.toString()}`

  try {
    const { data } = await axios.get(apiUrl)

    if (data.screenshot) {
      metadata.setCost(COST_PER_PAGE)
      return { imageUrl: data.screenshot, htmlUrl: data.extracted_html }
    } else {
      throw new Error('Screenshot not available')
    }
  } catch (error) {
    if (isAxiosError(error)) {
      logger.forBot().error('There was an error while taking the screenshot', error.response?.data)
    }

    throw error
  }
}
