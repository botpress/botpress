import { ZendeskEvent } from 'src/webhookEvents'
import { Client, Logger, Context } from '.botpress'

export const articleUnpublished = async ({
  event,
  client,
  logger,
  ctx,
}: {
  event: ZendeskEvent
  client: Client
  logger: Logger
  ctx: Context
}) => {
  if (ctx.configuration.syncKnowledgeBaseWithBot) {
    const existingFiles = await client.listFiles({
      tags: {
        zendeskId: `${event.detail.id}`,
      },
    })

    const existingFile = existingFiles.files[0]

    if (!existingFile) {
      logger.forBot().error('Article not found in the BP KB')
      return
    }

    await client.deleteFile({ id: existingFile.id })
    logger.forBot().info(`Successfully deleted unpublished article "${existingFile.tags?.title}"`)
  }

  await client.createEvent({
    type: 'articleUnpublished',
    payload: {
      articleId: event.detail.id,
    },
  })
}
