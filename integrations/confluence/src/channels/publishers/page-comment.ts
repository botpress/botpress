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

    const content = args.payload.text as string

    args.logger.forBot().info(`Creating comment on page "${pageId}" with content: "${content}"`)

    const client = ConfluenceClient(args.ctx.configuration)

    await client.writeFooterComment({ pageId: pageId.toString(), text: content })
  }

  export const getFooterComment = async (args: PageCommentPublisherArgs) => {
    const pageId = args.payload.pageId as number

    if (!pageId) {
      args.logger.error('Page ID must be set')
    }

    args.logger.forBot().info(`Getting comments on page "${pageId}"`)

    const client = ConfluenceClient(args.ctx.configuration)

    await client.getFooterComments({ pageId: pageId.toString() })
  }
}
