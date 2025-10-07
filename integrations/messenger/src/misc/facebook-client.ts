import axios from 'axios'
import { getMetaClientCredentials } from './auth'
import { FacebookClientConfig, CommentReply, PostReply } from './types'
import * as bp from '.botpress'
import { MetaClient } from './meta-client'

export class FacebookClient {
  private _pageAccessToken: string
  private _pageId: string
  private _baseUrl = 'https://graph.facebook.com/v23.0'
  private _logger?: bp.Logger

  public constructor(config: FacebookClientConfig, logger?: bp.Logger) {
    this._pageAccessToken = config.pageAccessToken
    this._pageId = config.pageId
    this._logger = logger
  }

  // Helper method for making Facebook API requests
  private async _makeRequest<T = any>(
    method: 'GET' | 'POST' | 'DELETE',
    endpoint: string,
    data?: any,
    customHeaders: Record<string, string> = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this._baseUrl}/${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this._pageAccessToken}`,
      ...customHeaders,
    }

    const response = await axios({
      method,
      url,
      data,
      headers,
    })

    return response.data
  }

  // Post Methods

  public async replyToPost(reply: PostReply): Promise<{ id: string }> {
    return this._makeRequest('POST', `${this._pageId}/comments`, {
      message: reply.message,
    })
  }

  public async getPost(postId: string): Promise<any> {
    return this._makeRequest('GET', postId)
  }

  // Comment Methods

  public async replyToComment(reply: CommentReply): Promise<{ id: string }> {
    return this._makeRequest('POST', `${reply.commentId}/comments`, {
      message: reply.message,
    })
  }

  public async getComment(commentId: string): Promise<any> {
    return this._makeRequest('GET', commentId)
  }

  public async deleteComment(commentId: string): Promise<{ success: boolean }> {
    await this._makeRequest('DELETE', commentId)
    return { success: true }
  }

  public async hideComment(commentId: string): Promise<{ success: boolean }> {
    await this._makeRequest('POST', commentId, {
      data: {
        is_hidden: true,
      },
    })
    return { success: true }
  }

  public async showComment(commentId: string): Promise<{ success: boolean }> {
    await this._makeRequest('POST', commentId, {
      is_hidden: false,
    })
    return { success: true }
  }
}

// Factory Functions

export async function createFacebookClient(
  ctx: bp.Context,
  client?: bp.Client,
  logger?: bp.Logger
): Promise<FacebookClient> {
  let pageId: string
  let pageAccessToken: string

  if (ctx.configurationType === 'manual') {
    pageId = ctx.configuration.pageId
    pageAccessToken = ctx.configuration.accessToken
  } else {
    // For OAuth configurations, get credentials
    if (!client) {
      throw new Error('Client is required for OAuth configuration')
    }
    const credentials = await getMetaClientCredentials(client, ctx)
    pageId = credentials.pageId
    pageAccessToken = credentials.pageToken || ''
  }

  if (!pageId) {
    throw new Error('Facebook page ID is required')
  }

  if (!pageAccessToken) {
    throw new Error('Facebook page access token is required')
  }

  return new FacebookClient(
    {
      pageId,
      pageAccessToken,
    },
    logger
  )
}

export async function createFacebookClientFromMeta(
  metaClient: MetaClient,
  pageId: string,
  logger?: bp.Logger
): Promise<FacebookClient> {
  // Get page token from MetaClient
  const pageToken = await metaClient.getPageToken(pageId)

  return new FacebookClient(
    {
      pageId,
      pageAccessToken: pageToken,
    },
    logger
  )
}
