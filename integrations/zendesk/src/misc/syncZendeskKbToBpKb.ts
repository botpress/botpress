import { isAxiosError } from 'axios'
import { getZendeskClient } from 'src/client'
import { Client, Context, Logger } from '.botpress'

type ZendeskArticle = {
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

  const kbId = ctx.configuration.knowledgeBaseId

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
      .error(`Error fetching Zendesk articles: ${error instanceof Error ? error.message : 'An unknown error occurred'}`)
    return
  }

  try {
    for (const article of articles) {
      if (article.draft) {
        continue
      }

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
    return
  }

  logger.forBot().info(`Successfully synced ${articles.length} articles `)
}
