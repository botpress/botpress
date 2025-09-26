import { getErrorFromUnknown } from '../misc/utils'
import { getMessengerClientCredentials, getMetaClientCredentials } from '../misc/auth'
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

  /**
   * Reply to a Facebook comment
   */
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
    } catch (error) {
      throw new Error(`Failed to reply to comment: ${getErrorFromUnknown(error).message}`)
    }
  }

  /**
   * Reply to a Facebook post
   */
  async replyToPost(reply: PostReply): Promise<{ id: string }> {
    try {
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
    } catch (error) {
      throw new Error(`Failed to reply to post: ${getErrorFromUnknown(error).message}`)
    }
  }

  /**
   * Get post details
   */
  async getPost(postId: string): Promise<any> {
    try {
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
    } catch (error) {
      throw new Error(`Failed to get post: ${getErrorFromUnknown(error).message}`)
    }
  }

  /**
   * Get comment details
   */
  async getComment(commentId: string): Promise<any> {
    try {
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
    } catch (error) {
      throw new Error(`Failed to get comment: ${getErrorFromUnknown(error).message}`)
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<{ success: boolean }> {
    try {
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
    } catch (error) {
      throw new Error(`Failed to delete comment: ${getErrorFromUnknown(error).message}`)
    }
  }

  /**
   * Hide a comment
   */
  async hideComment(commentId: string): Promise<{ success: boolean }> {
    try {
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
    } catch (error) {
      throw new Error(`Failed to hide comment: ${getErrorFromUnknown(error).message}`)
    }
  }

  /**
   * Show a comment
   */
  async showComment(commentId: string): Promise<{ success: boolean }> {
    try {
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
    } catch (error) {
      throw new Error(`Failed to show comment: ${getErrorFromUnknown(error).message}`)
    }
  }
}

/**
 * Create a Facebook client instance
 */
export async function createFacebookClient(client: bp.Client, ctx: bp.Context): Promise<FacebookClient> {
  const { pageId } = await getMetaClientCredentials(client, ctx)
  const { accessToken } = await getMessengerClientCredentials(client, ctx)

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
