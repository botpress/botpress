import { getZendeskClient } from 'src/client'
import { ZendeskArticle } from 'src/definitions/schemas'
import { getUploadArticlePayload } from 'src/misc/utils'
import { Client, Context, Logger } from '.botpress'

export const uploadArticlesToKb = async (props: { ctx: Context; client: Client; logger: Logger; kbId: string }) => {
  const { ctx, client, logger, kbId } = props

  logger.forBot().info('Attempting to sync Zendesk KB to BP KB')

  const fetchedArticles: ZendeskArticle[] = []

  try {
    const fetchArticles = async (url: string) => {
      const zendeskClient = getZendeskClient(ctx.configuration)
      const response: { data: { articles: ZendeskArticle[]; next_page?: string } } = await zendeskClient.makeRequest({
        method: 'get',
        url,
      })

      const { articles, next_page } = response.data

      fetchedArticles.push(...articles)

      if (next_page) {
        await fetchArticles(next_page)
      }
    }
    await fetchArticles('/api/v2/help_center/articles')
  } catch (error) {
    logger
      .forBot()
      .error(`Error fetching Zendesk articles: ${error instanceof Error ? error.message : 'An unknown error occurred'}`)
    return
  }

  try {
    for (const article of fetchedArticles) {
      if (article.draft || !article.body) {
        logger.forBot().info(`Article "${article.title}" is either unpublished or empty. Skipping...`)
        continue
      }

      const payload = getUploadArticlePayload({ kbId, article })

      await client.uploadFile(payload)

      logger.forBot().info(`Successfully uploaded article ${article.title} to BP KB`)
    }
  } catch (error) {
    logger
      .forBot()
      .error(
        `Error uploading article to BP KB: ${error instanceof Error ? error.message : 'An unknown error occurred'}`
      )
    logger.forBot().error(JSON.stringify(error))
    return
  }

  logger.forBot().info('Successfully synced Zendesk KB to BP KB')
}
