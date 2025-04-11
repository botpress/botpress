import * as bp from '.botpress'
import { IntegrationLogger } from '@botpress/sdk'
import axios from 'axios'

type PageCommentPublisherArgs = {
  payload: Record<string, unknown>
  logger: IntegrationLogger
}

export namespace PageCommentPublisher {
  export const publishFooterComment = async (args: PageCommentPublisherArgs) => {
    const pageId = args.payload.pageId as number

    if (!pageId) {
      args.logger.error('Page ID must be set')
    }

    const content = args.payload.text

    args.logger.forBot().info(`Creating comment on page "${pageId}" with content: "${content}"`)

    await writeFooterComment(typeof pageId === 'string' ? parseInt(pageId) : pageId, args.logger)
  }
}

async function writeFooterComment(pageId: number, logger: IntegrationLogger) {
  const auth = Buffer.from(`${bp.secrets.CONFLUENCE_USER}:${bp.secrets.CONFLUENCE_API_TOKEN}`).toString('base64')

  const config = {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
    },
  }
  try {
    const response = await axios.get(`${bp.secrets.CONFLUENCE_HOST}/wiki/api/v2/pages/${pageId}`, config)
    return response.data
  } catch (err) {
    logger.error('Error while calling confluence', err)
  }
}
