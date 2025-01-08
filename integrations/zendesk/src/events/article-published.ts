import { getZendeskClient } from 'src/client'
import { ZendeskArticle } from 'src/definitions/schemas'
import { getUploadArticlePayload } from 'src/misc/utils'
import { ZendeskEvent } from 'src/webhookEvents'
import { Logger, Client, Context } from '.botpress'

export const articlePublished = async (props: {
  event: ZendeskEvent
  client: Client
  ctx: Context
  logger: Logger
}) => {
  const { event, client, ctx, logger } = props

  if (ctx.configuration.syncKnowledgeBaseWithBot) {
    const kbId = ctx.configuration.knowledgeBaseId

    if (!kbId) {
      logger.forBot().error('Knowledge base id was not provided')
      return
    }

    const zendeskClient = getZendeskClient(ctx.configuration)

    const response: { data: { article: ZendeskArticle } } = await zendeskClient.makeRequest({
      method: 'get',
      url: `/api/v2/help_center/articles/${event.detail.id}`,
    })

    const publishedArticle = response.data.article

    if (!publishedArticle.body) {
      logger.forBot().info(`Article "${publishedArticle.title}" is empty. Skipping...`)
      return
    }

    const payload = getUploadArticlePayload({ kbId, article: publishedArticle })
    await client.uploadFile(payload)
    logger.forBot().info(`Successfully uploaded published article "${publishedArticle.title}"`)
  }

  await client.createEvent({
    type: 'articlePublished',
    payload: {
      articleId: event.detail.id,
      articleTitle: event.event.title,
    },
  })
}
