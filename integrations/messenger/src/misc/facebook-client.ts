import axios from 'axios'
import { getFacebookClientCredentials } from './auth'
import { FacebookClientCredentials, CommentReply, PostReply } from './types'
import { makeMetaErrorHandler } from './utils'
import * as bp from '.botpress'

export class FacebookClient {
  private _pageAccessToken: string
  private _pageId: string
  private _baseUrl = 'https://graph.facebook.com/v23.0'

  public constructor(config: FacebookClientCredentials) {
    this._pageAccessToken = config.pageToken
    this._pageId = config.pageId
  }

  // Helper method for making Facebook API requests
  private async _makeRequest<T = any>({
    method,
    endpoint,
    data,
    customHeaders,
  }: {
    method: 'GET' | 'POST' | 'DELETE'
    endpoint: string
    data?: any
    customHeaders?: Record<string, string>
  }): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this._baseUrl}/${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this._pageAccessToken}`,
      ...(customHeaders ?? {}),
    }

    const response = await axios({
      method,
      url,
      data,
      headers,
    }).catch(makeMetaErrorHandler(url))

    return response.data
  }

  // Post Methods
  public async replyToPost(reply: PostReply): Promise<{ id: string }> {
    return this._makeRequest({
      method: 'POST',
      endpoint: `${this._pageId}/comments`,
      data: {
        message: reply.message,
      },
    })
  }

  public async getPost(postId: string): Promise<any> {
    return this._makeRequest({ method: 'GET', endpoint: postId })
  }

  // Comment Methods
  public async replyToComment(reply: CommentReply): Promise<{ id: string }> {
    return this._makeRequest({
      method: 'POST',
      endpoint: `${reply.commentId}/comments`,
      data: {
        message: reply.message,
      },
    })
  }

  public async getComment(commentId: string): Promise<any> {
    return this._makeRequest({ method: 'GET', endpoint: commentId })
  }

  public async deleteComment(commentId: string): Promise<{ success: boolean }> {
    await this._makeRequest({ method: 'DELETE', endpoint: commentId })
    return { success: true }
  }

  public async hideComment(commentId: string): Promise<{ success: boolean }> {
    await this._makeRequest({
      method: 'POST',
      endpoint: commentId,
      data: {
        data: {
          is_hidden: true,
        },
      },
    })
    return { success: true }
  }

  public async showComment(commentId: string): Promise<{ success: boolean }> {
    await this._makeRequest({
      method: 'POST',
      endpoint: commentId,
      data: {
        data: {
          is_hidden: false,
        },
      },
    })
    return { success: true }
  }
}

// Factory Functions
export async function createAuthenticatedFacebookClient(ctx: bp.Context, client: bp.Client): Promise<FacebookClient> {
  const credentials = await getFacebookClientCredentials(client, ctx)
  return new FacebookClient(credentials)
}
