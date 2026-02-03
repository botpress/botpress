import * as notionhq from '@notionhq/client'
import {
  BlockObjectRequest,
  BlockObjectResponse,
  DataSourceObjectResponse,
  PartialDataSourceObjectResponse,
  PartialPageObjectResponse,
  RichTextItemResponse,
  UpdatePageParameters,
  CreatePageParameters,
  CreateCommentParameters,
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
  }): Promise<{ pageId: string }> {
    const response = await this._notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    })
    return { pageId: response.id }
  }

  @handleErrors('Failed to create page')
  public async createPage({
    parentType,
    parentId,
    title,
    dataSourceTitleName,
  }: {
    parentType: string
    parentId: string
    title: string
    dataSourceTitleName: string
  }): Promise<{ pageId: string }> {
    let parent: CreatePageParameters['parent']
    let properties: CreatePageParameters['properties']

    if (parentType === 'data source') {
      const dataSource = await this._notion.dataSources.retrieve({ data_source_id: parentId })
      if (!dataSource.properties[dataSourceTitleName]) {
        throw new Error(`Title property "${dataSourceTitleName}" not found in data source properties`)
      }
      parent = { data_source_id: parentId, type: 'data_source_id' }
      properties = { [dataSourceTitleName]: { title: [{ text: { content: title } }] } }
    } else {
      parent = { page_id: parentId, type: 'page_id' }
      properties = { title: { title: [{ text: { content: title } }] } }
    }

    const response = await this._notion.pages.create({ parent, properties })
    return { pageId: response.id }
  }

  @handleErrors('Failed to add comment')
  public async addComment({
    parentType,
    parentId,
    commentBody,
  }: {
    parentType: string
    parentId: string
    commentBody: string
  }): Promise<{ commentId: string; discussionId?: string }> {
    let body: CreateCommentParameters
    if (parentType === 'page') {
      body = {
        parent: { page_id: parentId, type: 'page_id' },
        rich_text: [{ type: 'text', text: { content: commentBody } }],
      }
    } else if (parentType === 'block') {
      body = {
        parent: { block_id: parentId, type: 'block_id' },
        rich_text: [{ type: 'text', text: { content: commentBody } }],
      }
    } else if (parentType === 'discussion') {
      body = { discussion_id: parentId, rich_text: [{ type: 'text', text: { content: commentBody } }] }
    } else {
      throw new Error(`Invalid parent type: ${parentType}`)
    }
    const response = await this._notion.comments.create(body)

    return { commentId: response.id, discussionId: 'discussion_id' in response ? response.discussion_id : undefined }
  }

  @handleErrors('Failed to update page properties')
  public async updatePageProperties({
    pageId,
    properties,
  }: {
    pageId: string
    properties: UpdatePageParameters['properties']
  }) {
    return await this._notion.pages.update({
      page_id: pageId,
      properties,
    })
  }

  @handleErrors('Failed to delete block')
  public async deleteBlock({ blockId }: { blockId: string }): Promise<{ blockId: string }> {
    const response = await this._notion.blocks.delete({ block_id: blockId })
    return { blockId: response.id }
  }

  @handleErrors('Failed to append block to page')
  public async appendBlocksToPage({
    pageId,
    blocks,
  }: {
    pageId: string
    blocks: BlockObjectRequest[]
  }): Promise<{ pageId: string; blockIds: string[] }> {
    const response = await this._notion.blocks.children.append({
      block_id: pageId,
      children: blocks,
    })
    return {
      pageId,
      blockIds: response.results.map((block) => block.id),
    }
  }

  @handleErrors('Failed to search by title')
  public async searchByTitle({ title }: { title?: string }) {
    const [response, dataSourceResponse] = await Promise.all([
      this._notion.search({
        query: title,
        filter: { property: 'object', value: 'page' },
      }),
      this._notion.search({
        query: title,
        filter: { property: 'object', value: 'data_source' },
      }),
    ])

    const allResults = [...response.results, ...dataSourceResponse.results]

    const formattedResults = this._formatSearchResults(allResults)

    return { results: formattedResults }
  }

  @handleErrors('Failed to get database')
  public async getDbWithStructure({ databaseId }: { databaseId: string }) {
    const response = await this._notion.dataSources.retrieve({ data_source_id: databaseId })

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

  @handleErrors('Failed to get data source')
  public async getDataSource({ dataSourceId }: { dataSourceId: string }) {
    const ds = await this._notion.dataSources.retrieve({ data_source_id: dataSourceId })
    return 'parent' in ds && 'created_time' in ds ? ds : undefined
  }

  @handleErrors('Failed to retrieve page')
  public async getPage({ pageId }: { pageId: string }) {
    const page = await this._notion.pages.retrieve({ page_id: pageId })
    return 'parent' in page && 'created_time' in page ? page : undefined
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
        if (!this._isBlockObjectResponse(block)) {
          continue
        }

        const blockType = block.type
        const richText = this._extractRichTextFromBlockSwitch(block)

        let parentId: string | undefined
        if (block.parent.type === 'page_id') {
          parentId = block.parent.page_id
        } else if (block.parent.type === 'block_id') {
          parentId = block.parent.block_id
        } else {
          parentId = undefined
        }

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

    return 'parent' in db && 'created_time' in db
      ? {
          object: db.object,
          dataSources: db.data_sources,
        }
      : undefined
  }

  @handleErrors('Failed to enumerate data source children')
  public async enumerateDataSourceChildren({ dataSourceId, nextToken }: { dataSourceId: string; nextToken?: string }) {
    const { next_cursor, results } = await this._notion.dataSources.query({
      data_source_id: dataSourceId,
      in_trash: false,
      start_cursor: nextToken,
    })

    const filteredResults = results.filter(
      (res): res is types.NotionDataSourceChild => 'parent' in res && !res.in_trash
    )

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

  private _formatSearchResults(
    results: (PartialPageObjectResponse | PartialDataSourceObjectResponse | DataSourceObjectResponse)[]
  ) {
    return results
      .filter(
        (result): result is types.NotionTopLevelItem => 'parent' in result && !('archived' in result && result.archived)
      )
      .map((result) => {
        let resultTitle = ''
        let resultUrl = ''

        if (result.object === 'page' && 'properties' in result) {
          const titleProp = Object.values(result.properties).find(
            (prop): prop is { type: 'title'; title: RichTextItemResponse[]; id: string } =>
              typeof prop === 'object' && prop !== null && 'type' in prop && prop.type === 'title'
          )
          if (titleProp) {
            resultTitle = titleProp.title.map((t) => t.plain_text).join('')
          }
          if ('url' in result) {
            resultUrl = result.url
          }
        } else if (result.object === 'data_source' && 'title' in result && Array.isArray(result.title)) {
          resultTitle = result.title.map((t) => t.plain_text).join('')
          if ('url' in result) {
            resultUrl = result.url
          }
        }

        return {
          id: result.id,
          title: resultTitle,
          type: result.object,
          url: resultUrl,
        }
      })
  }

  private _isBlockObjectResponse(block: unknown): block is BlockObjectResponse {
    return typeof block === 'object' && block !== null && 'type' in block && typeof block.type === 'string'
  }

  private _extractRichTextFromBlockSwitch(block: BlockObjectResponse): RichTextItemResponse[] {
    switch (block.type) {
      case 'paragraph':
        return block[block.type].rich_text
      case 'heading_1':
        return block[block.type].rich_text
      case 'heading_2':
        return block[block.type].rich_text
      case 'heading_3':
        return block[block.type].rich_text
      case 'bulleted_list_item':
        return block[block.type].rich_text
      case 'numbered_list_item':
        return block[block.type].rich_text
      case 'to_do':
        return block[block.type].rich_text
      case 'toggle':
        return block[block.type].rich_text
      case 'quote':
        return block[block.type].rich_text
      case 'callout':
        return block[block.type].rich_text
      case 'code':
        return block[block.type].rich_text
      default:
        return []
    }
  }
}
