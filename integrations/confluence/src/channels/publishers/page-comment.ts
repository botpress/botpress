import { IntegrationLogger } from '@botpress/sdk'
import { ConfluenceClient } from 'src/client'
import type { Context } from '.botpress'

type PageCommentPublisherArgs = {
  payload: Record<string, unknown>
  logger: IntegrationLogger
  ctx: Context
}

export namespace PageCommentPublisher {
  export const publishFooterComment = async (args: PageCommentPublisherArgs) => {
    const pageId = args.payload.pageId as number

    if (!pageId) {
      args.logger.error('Page ID must be set')
    }

    const content = args.payload.text

    args.logger.forBot().info(`Creating comment on page "${pageId}" with content: "${content}"`)

    const client = ConfluenceClient(args.ctx.configuration)

    const pageIdInt = typeof pageId === 'string' ? parseInt(pageId) : pageId
    await client.writeFooterComment({ pageId: pageIdInt })
  }
}
