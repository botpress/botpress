import { isAxiosError } from 'axios'
import { getZendeskClient } from 'src/client'
import { Client, Context, Logger } from '.botpress'
import { stringifyProperties } from './utils'

export type ZendeskArticle = {
  id: number
  url: string
  html_url: string
  author_id: number
  comments_disabled: boolean
  draft: boolean
  promoted: boolean
  position: number
  vote_sum: number
  vote_count: number
  section_id: number
  created_at: string
  updated_at: string
  name: string
  title: string
  source_locale: string
  locale: string
  outdated: boolean
  outdated_locales: string[]
  edited_at: string
  user_segment_id: number | null
  permission_group_id: number
  content_tag_ids: number[]
  label_names: string[]
  body: string
}

export const syncZendeskArticlesToBotpressKB = async (props: { ctx: Context; client: Client; logger: Logger }) => {
  const { ctx, client, logger } = props

  logger.forBot().info('Attempting to sync Zendesk KB to bot KB')

  const fetchedArticles: ZendeskArticle[] = []

  //fetch articles from Zendesk
  try {
    const fetchArticles = async (url: string) => {
      const requestConfig = {
        method: 'get',
        url,
        params: {
          per_page: 1,
        },
      }

      const zendeskClient = getZendeskClient(ctx.configuration)

      const { data }: { data: { articles: ZendeskArticle[]; next_page?: string } } = await zendeskClient.makeRequest(
        requestConfig
      )

      const { articles, next_page } = data
      // console.log(data)
      // console.log('==========')
      fetchedArticles.push(...articles)

      if (next_page) {
        await fetchArticles(next_page)
      }
    }

    await fetchArticles(`/api/v2/help_center/articles`)
  } catch (error) {
    logger
      .forBot()
      .error(`Error fetching Zendesk articles: ${error instanceof Error ? error.message : 'An unknown error occurred'}`)
    return
  }

  //upload articles to BP
  try {
    for (const article of fetchedArticles) {
      if (article.draft || !article.body) {
        continue
      }

      const { body: articleBody, id: articleId, title, locale, label_names } = article
      console.log(article)
      console.log(kbId)
      console.log('===== article')

      await client.uploadFile({
        key: `${kbId}/${articleId}.html`,
        accessPolicies: [],
        content: article.body,
        index: true,
        tags: {
          source: 'knowledge-base',
          kbId,
          title: article.title,
          labels: article.label_names.join(' '),
          zendeskId: `${article.id}`,
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
    logger.forBot().error(JSON.stringify(error))

    return
  }

  logger.forBot().info(`Successfully synced ${fetchedArticles.length} articles `)
}
