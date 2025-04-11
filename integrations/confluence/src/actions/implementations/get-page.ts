import { IntegrationLogger } from '@botpress/sdk'
import axios from 'axios'
import * as bp from '.botpress'

export const getPage: bp.IntegrationProps['actions']['getPage'] = async ({ input, logger }) => {
  const pageId = parseInt(input.pageId)

  if (!pageId) {
    logger.error('Page ID is required')
  }

  try {
    const pageData = await getConfluencePage(pageId, logger)
    logger.debug('pageData', pageData)
    if (!pageData) {
      logger.error(`Page with ID ${pageId} not found`)
    }

    return pageData
  } catch (error) {
    logger.error('Error in while fetching confluence page', error)
  }
}

export async function getConfluencePage(pageId: number, logger?: IntegrationLogger) {
  const auth = Buffer.from(`${bp.secrets.CONFLUENCE_USER}:${bp.secrets.CONFLUENCE_API_TOKEN}`).toString('base64')

  const config = {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
    },
  }
  try {
    const response = await axios.get(
      `${bp.secrets.CONFLUENCE_HOST}/wiki/api/v2/pages/${pageId}?body-format=ATLAS_DOC_FORMAT`,
      config
    )
    return response.data
  } catch (err) {
    logger?.error('Error while calling confluence', err)
  }
}
