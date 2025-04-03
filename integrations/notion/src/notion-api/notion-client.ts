import * as notionhq from '@notionhq/client'
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
      return ctx.configuration.authToken
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
}
