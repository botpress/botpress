import axios from 'axios'
import * as bp from '.botpress'

export type FacebookClientConfig = {
  accessToken: string
  pageId: string
}

export type CommentReply = {
  message: string
  commentId: string
}

export type PostReply = {
  message: string
  postId: string
}

export class FacebookClient {
  private accessToken: string
  private pageId: string
  private baseUrl = 'https://graph.facebook.com/v23.0'

  constructor(config: FacebookClientConfig) {
    this.accessToken = config.accessToken
    this.pageId = config.pageId
  }

  async replyToComment(reply: CommentReply): Promise<{ id: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${reply.commentId}/comments`,
        {
          message: reply.message,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      )

      if (response.status !== 200) {
        const errorData = response.data
        throw new Error(`Facebook API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
      }

      return response.data
    } catch (thrown) {
      const error = thrown instanceof Error ? thrown : new Error(String(thrown))
      throw new Error(`Facebook API error: ${error.message}`)
    }
  }

  async replyToPost(reply: PostReply): Promise<{ id: string }> {
    const response = await axios.post(
      `${this.baseUrl}/${this.pageId}/feed`,
      {
        message: reply.message,
        link: `https://facebook.com/${reply.postId}`,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    )

    if (response.status !== 200) {
      const errorData = response.data
      throw new Error(`Facebook API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
    }

    return response.data
  }

  async getPost(postId: string): Promise<any> {
    const response = await axios.get(`${this.baseUrl}/${postId}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    })

    if (response.status !== 200) {
      const errorData = response.data
      throw new Error(`Facebook API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
    }

    return response.data
  }

  async getComment(commentId: string): Promise<any> {
    const response = await axios.get(`${this.baseUrl}/${commentId}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    })

    if (response.status !== 200) {
      const errorData = response.data
      throw new Error(`Facebook API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
    }

    return response.data
  }

  async deleteComment(commentId: string): Promise<{ success: boolean }> {
    const response = await axios.delete(`${this.baseUrl}/${commentId}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    })

    if (response.status !== 200) {
      const errorData = response.data
      throw new Error(`Facebook API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
    }

    return { success: true }
  }

  async hideComment(commentId: string): Promise<{ success: boolean }> {
    const response = await axios.post(
      `${this.baseUrl}/${commentId}`,
      {
        data: {
          is_hidden: true,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    )

    if (response.status !== 200) {
      const errorData = response.data
      throw new Error(`Facebook API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
    }

    return { success: true }
  }

  async showComment(commentId: string): Promise<{ success: boolean }> {
    const response = await axios.post(
      `${this.baseUrl}/${commentId}`,
      {
        is_hidden: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    )

    if (response.status !== 200) {
      const errorData = response.data
      throw new Error(`Facebook API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
    }

    return { success: true }
  }
}

export async function createFacebookClient(ctx: bp.Context): Promise<FacebookClient> {
  // Only manual configuration is supported
  if (ctx.configurationType !== 'manual') {
    throw new Error('Manual configuration is not supported')
  }
  const { pageId, accessToken } = ctx.configuration

  if (!accessToken) {
    throw new Error('Facebook access token is required')
  }

  if (!pageId) {
    throw new Error('Facebook page ID is required')
  }

  return new FacebookClient({
    accessToken,
    pageId,
  })
}
