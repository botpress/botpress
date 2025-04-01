import { Client as NotionHQClient } from '@notionhq/client'
import { getDbStructure } from './db-structure'
import { handleErrorsDecorator as handleErrors } from './error-handling'
import { NotionOAuthClient } from './notion-oauth-client'
import type { NotionPagePropertyTypes } from './types'
import * as bp from '.botpress'

export class NotionClient {
  private _notion: NotionHQClient

  private constructor(credentials: { accessToken: string }) {
    this._notion = new NotionHQClient({
      auth: credentials.accessToken,
    })
  }

  public static async create({ ctx, client }: { client: bp.Client; ctx: bp.Context }): Promise<NotionClient> {
    const accessToken = await this._getAccessToken({ ctx, client })

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
    properties: Record<NotionPagePropertyTypes, any>
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
}
