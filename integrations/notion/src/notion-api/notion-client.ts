import * as notionhq from '@notionhq/client'
import {
  PartialDatabaseObjectResponse,
  PartialPageObjectResponse,
  RichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints'
import { getDbStructure } from './db-structure'
import { handleErrorsDecorator as handleErrors } from './error-handling'
import { NotionOAuthClient } from './notion-oauth-client'
import { NotionToMdxClient } from './notion-to-mdx-client'
import type * as types from './types'
import * as bp from '.botpress'

export class NotionClient {
  private readonly _notion: notionhq.Client
  private readonly _notionToMdxClient: NotionToMdxClient

  private constructor(credentials: { accessToken: string }) {
    this._notion = new notionhq.Client({
      auth: credentials.accessToken,
    })
    this._notionToMdxClient = new NotionToMdxClient(this._notion)
  }

  public static async create({ ctx, client }: { client: bp.Client; ctx: bp.Context }): Promise<NotionClient> {
    const accessToken = await NotionClient._getAccessToken({ ctx, client })
    return new NotionClient({
      accessToken,
    })
  }

  public static async processAuthorizationCode(
    props: { client: bp.Client; ctx: bp.Context },
    authorizationCode: string
  ): Promise<{ workspaceId: string }> {
    const oauthClient = new NotionOAuthClient(props)
    return await oauthClient.processAuthorizationCode(authorizationCode)
  }

  private static async _getAccessToken({ ctx, client }: { client: bp.Client; ctx: bp.Context }): Promise<string> {
    if (ctx.configurationType === 'customApp') {
      return ctx.configuration.internalIntegrationSecret
    }

    const oauthClient = new NotionOAuthClient({ ctx, client })
    const { accessToken } = await oauthClient.getNewAccessToken()
    return accessToken
  }

  @handleErrors('Authentication failed. Please reconfigure the integration.')
  public async testAuthentication(): Promise<void> {
    void (await this._notion.users.me({}))
  }

  @handleErrors('Failed to add page to database')
  public async addPageToDb({
    databaseId,
    properties,
  }: {
    databaseId: string
    properties: Record<types.NotionPagePropertyTypes, any>
  }): Promise<void> {
    void (await this._notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    }))
  }

  @handleErrors('Failed to add comment to page')
  public async addCommentToPage({ pageId, commentBody }: { pageId: string; commentBody: string }): Promise<void> {
    void (await this._notion.comments.create({
      parent: { page_id: pageId },
      rich_text: [
        {
          type: 'text',
          text: {
            content: commentBody,
          },
        },
      ],
    }))
  }

  @handleErrors('Failed to add comment to discussion')
  public async addCommentToDiscussion({
    discussionId,
    commentBody,
  }: {
    discussionId: string
    commentBody: string
  }): Promise<void> {
    void (await this._notion.comments.create({
      discussion_id: discussionId,
      rich_text: [
        {
          type: 'text',
          text: {
            content: commentBody,
          },
        },
      ],
    }))
  }

  @handleErrors('Failed to delete block')
  public async deleteBlock({ blockId }: { blockId: string }): Promise<void> {
    void (await this._notion.blocks.delete({ block_id: blockId }))
  }

  @handleErrors('Failed to search by title')
  public async searchByTitle({ title }: { title?: string }) {
    const [response, databaseResponse] = await Promise.all([
      this._notion.search({
        query: title,
        filter: { property: 'object', value: 'page' },
      }),
      this._notion.search({
        query: title,
        filter: { property: 'object', value: 'database' },
      }),
    ])

    const allResults = [...response.results, ...databaseResponse.results]

    const formattedResults = this._formatSearchResults(allResults)

    return { results: formattedResults }
  }

  @handleErrors('Failed to get database')
  public async getDbWithStructure({ databaseId }: { databaseId: string }) {
    const response = await this._notion.databases.retrieve({ database_id: databaseId })

    // TODO: do not return the raw response; perform mapping

    return { ...response, structure: getDbStructure(response) }
  }

  @handleErrors('Failed to enumerate items')
  public async enumerateTopLevelItems({ nextToken }: { nextToken?: string }) {
    const { next_cursor, results } = await this._notion.search({ start_cursor: nextToken })

    // Discard partial or nested results:
    const filteredResults = results.filter(
      (res) => 'parent' in res && res.parent.type === 'workspace' && !res.in_trash
    ) as types.NotionTopLevelItem[]

    return {
      results: filteredResults,
      nextToken: next_cursor ?? undefined,
    }
  }

  @handleErrors('Failed to enumerate page children')
  public async enumeratePageChildren({ pageId, nextToken }: { pageId: string; nextToken?: string }) {
    const { next_cursor, results } = await this._notion.blocks.children.list({
      block_id: pageId,
      start_cursor: nextToken,
    })

    const filteredResults = results.filter(
      (res) => 'parent' in res && !res.in_trash && ['child_page', 'child_database'].includes(res.type)
    ) as types.NotionPageChild[]

    return {
      results: filteredResults,
      nextToken: next_cursor ?? undefined,
    }
  }

  @handleErrors('Failed to retrieve page')
  public async getPage({ pageId }: { pageId: string }) {
    const page = await this._notion.pages.retrieve({ page_id: pageId })
    return 'parent' in page ? page : undefined
  }

  @handleErrors('Failed to get page content')
  public async getPageContent({ pageId }: { pageId: string }) {
    const blocks: types.BlockContent[] = []
    let nextCursor: string | undefined

    do {
      const response = await this._notion.blocks.children.list({
        block_id: pageId,
        start_cursor: nextCursor,
      })

      for (const block of response.results) {
        if (!('type' in block)) {
          continue
        }

        const blockType = block.type
        const blockData = block[blockType as keyof typeof block] as Record<string, unknown> | undefined
        const richText = (blockData?.rich_text as RichTextItemResponse[] | undefined) ?? []

        const parentId =
          block.parent.type === 'page_id'
            ? block.parent.page_id
            : block.parent.type === 'block_id'
              ? block.parent.block_id
              : undefined

        blocks.push({
          blockId: block.id,
          parentId,
          type: blockType,
          hasChildren: block.has_children,
          richText,
        })
      }

      nextCursor = response.next_cursor ?? undefined
    } while (nextCursor)

    return { blocks }
  }

  @handleErrors('Failed to get database')
  public async getDatabase({ databaseId }: { databaseId: string }) {
    const db = await this._notion.databases.retrieve({ database_id: databaseId })

    return 'parent' in db ? db : undefined
  }

  @handleErrors('Failed to enumerate database children')
  public async enumerateDatabaseChildren({ databaseId, nextToken }: { databaseId: string; nextToken?: string }) {
    const { next_cursor, results } = await this._notion.databases.query({
      database_id: databaseId,
      in_trash: false,
      start_cursor: nextToken,
    })

    const filteredResults = results.filter((res) => 'parent' in res && !res.in_trash) as types.NotionDatabaseChild[]

    return {
      results: filteredResults,
      nextToken: next_cursor ?? undefined,
    }
  }

  @handleErrors('Failed to download page as markdown')
  public async downloadPageAsMarkdown({ pageId }: { pageId: string }): Promise<{ markdown: string }> {
    const markdown = await this._notionToMdxClient.convertNotionPageToMarkdown({ pageId })

    return { markdown }
  }

  private _formatSearchResults(results: (PartialPageObjectResponse | PartialDatabaseObjectResponse)[]) {
    return results
      .filter(
        (result): result is types.NotionTopLevelItem => 'parent' in result && !('archived' in result && result.archived)
      )
      .map((result) => {
        let resultTitle = ''

        if (result.object === 'page' && 'properties' in result) {
          const titleProp = Object.values(result.properties).find(
            (prop): prop is { type: 'title'; title: RichTextItemResponse[]; id: string } =>
              typeof prop === 'object' && prop !== null && 'type' in prop && prop.type === 'title'
          )
          if (titleProp) {
            resultTitle = titleProp.title.map((t) => t.plain_text).join('')
          }
        } else if (result.object === 'database' && 'title' in result && Array.isArray(result.title)) {
          resultTitle = result.title.map((t) => t.plain_text).join('')
        }

        return {
          id: result.id,
          title: resultTitle,
          type: result.object,
          url: result.url,
        }
      })
  }
}
