import axios, { isAxiosError } from 'axios'
import * as bp from '.botpress'

export const captureScreenshot: bp.IntegrationProps['actions']['captureScreenshot'] = async ({ input, logger }) => {
  logger.forBot().debug('Capturing Screenshot', { input })

  const apiUrl = `https://shot.screenshotapi.net/screenshot?token=${
    bp.secrets.SCREENSHOT_API_KEY
  }&url=${encodeURIComponent(
    input.url
  )}&width=1920&height=1080&full_page=true&fresh=true&output=json&file_type=png&wait_for_event=load`

  try {
    const { data } = await axios.get(apiUrl)

    if (data.screenshot) {
      return { imageUrl: data.screenshot }
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
