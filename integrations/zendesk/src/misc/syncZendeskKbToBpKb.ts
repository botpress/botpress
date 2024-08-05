import { isAxiosError } from 'axios'
import { getZendeskClient } from 'src/client'
import { Client, Context, Logger } from '.botpress'

type ZendeskArticle = {
  id: number
  title: string
  body: string
  label_names: string[]
}

export const syncZendeskArticlesToBotpressKB = async (props: { ctx: Context; client: Client; logger: Logger }) => {
  const { ctx, client, logger } = props

  logger.forBot().info('Attempting to sync Zendesk KB to bot KB')

  const zendeskClient = getZendeskClient(ctx.configuration)

  const articles: ZendeskArticle[] = []

  try {
    const fetch = async (url: string) => {
      const requestConfig = {
        method: 'get',
        url,
        params: {
          per_page: 1,
        },
      }

      const { data }: { data: { articles: ZendeskArticle[]; next_page?: string } } = await zendeskClient.makeRequest(
        requestConfig
      )

      articles.push(...data.articles)

      if (data.next_page) {
        await fetch(data.next_page)
      }
    }

    await fetch(`/api/v2/help_center/articles`)
  } catch (error) {
    logger
      .forBot()
      .error(
        `Error fetching Zendesk articles: ${
          isAxiosError(error)
            ? `${error.name}, ${error.message}`
            : error instanceof Error
            ? error.message
            : 'An unknown error occurred'
        }`
      )
  }

  const kbId = ctx.configuration.knowledgeBaseId

  try {
    for (const article of articles) {
      await client.uploadFile({
        key: `${kbId}/${article.id}.html`,
        accessPolicies: [],
        content: article.body,
        index: true,
        tags: {
          source: 'knowledge-base',
          kbId,
          title: article.title,
          labels: article.label_names.join(' '),
          id: `${article.id}`,
        },
      })
    }
  } catch (error) {
    logger
      .forBot()
      .error(
        `Error uploading Zendesk articles to BP KB: ${
          error instanceof Error ? error.message : 'An unknown error occurred'
        }`
      )
  }

  logger.forBot().info(`Successfully synced ${articles.length} articles `)
}
