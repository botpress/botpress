import * as sdk from '@botpress/sdk'
import { LinkedInBaseApi } from '../base-api'
import { extractLinkedInHeaders } from '../linkedin-oauth-client'
import { initializeUploadResponseSchema } from '../schemas'
import { getImageBufferFromResponse } from './get-image-buffer-from-response'

export type CreatePostParams = {
  authorUrn: string
  text: string
  visibility?: 'PUBLIC' | 'CONNECTIONS'
  imageUrl?: string
  articleUrl?: string
  articleTitle?: string
  articleDescription?: string
}

export type CreatePostResult = {
  postUrn: string
  postUrl: string
}

export class PostsApi extends LinkedInBaseApi {
  public async createPost(params: CreatePostParams): Promise<CreatePostResult> {
    const { authorUrn, text, visibility, imageUrl, articleUrl, articleTitle, articleDescription } = params

    let content: Record<string, unknown> | undefined = undefined

    if (imageUrl) {
      const imageUrn = await this._uploadImageFromUrl(imageUrl, authorUrn)
      content = {
        media: {
          id: imageUrn,
        },
      }
    } else if (articleUrl) {
      content = {
        article: {
          source: articleUrl,
          ...(articleTitle && { title: articleTitle }),
          ...(articleDescription && { description: articleDescription }),
        },
      }
    }

    const response = await this.fetchWithErrorHandling(
      '/posts',
      {
        method: 'POST',
        body: {
          author: authorUrn,
          lifecycleState: 'PUBLISHED',
          commentary: text,
          visibility,
          distribution: {
            feedDistribution: 'MAIN_FEED',
          },
          ...(content && { content }),
        },
      },
      'Failed to create LinkedIn post'
    )

    const postUrn = response.headers.get('x-restli-id')

    if (!postUrn) {
      throw new sdk.RuntimeError('LinkedIn did not return a post URN in response headers')
    }

    return {
      postUrn,
      postUrl: `https://www.linkedin.com/feed/update/${postUrn}/`,
    }
  }

  public async deletePost(postUrn: string): Promise<void> {
    const encodedUrn = encodeURIComponent(postUrn)

    await this.fetchWithErrorHandling(
      `/posts/${encodedUrn}`,
      { method: 'DELETE' },
      'Failed to delete LinkedIn post',
      { successStatuses: [204, 404] } // 204 = success, 404 = already deleted (treat as success)
    )
  }

  private async _uploadImageFromUrl(imageUrl: string, authorUrn: string): Promise<string> {
    const startTime = Date.now()
    this.logger.forBot().debug('Starting image upload for LinkedIn post')

    const imageBuffer = await this._downloadAndValidateImage(imageUrl)
    this.logger.forBot().debug('Image downloaded and validated', { size: imageBuffer.byteLength })

    const { uploadUrl, imageUrn } = await this._initializeImageUpload(authorUrn)
    await this._uploadImageBinary(uploadUrl, imageBuffer)

    this.logger.forBot().debug('Image upload completed', { imageUrn, duration: Date.now() - startTime })
    return imageUrn
  }

  private async _downloadAndValidateImage(imageUrl: string): Promise<ArrayBuffer> {
    const result = await getImageBufferFromResponse(await fetch(imageUrl))

    if (!result.success) {
      throw new sdk.RuntimeError(result.message)
    }
    return result.buffer
  }

  private async _initializeImageUpload(authorUrn: string): Promise<{ uploadUrl: string; imageUrn: string }> {
    const response = await this.fetchWithErrorHandling(
      '/images?action=initializeUpload',
      {
        method: 'POST',
        body: {
          initializeUploadRequest: {
            owner: authorUrn,
          },
        },
      },
      'Failed to initialize image upload with LinkedIn'
    )

    const data = initializeUploadResponseSchema.parse(await response.json())

    return {
      uploadUrl: data.value.uploadUrl,
      imageUrn: data.value.image,
    }
  }

  private async _uploadImageBinary(uploadUrl: string, imageBuffer: ArrayBuffer): Promise<void> {
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: imageBuffer,
    })

    if (!uploadResponse.ok) {
      const headers = extractLinkedInHeaders(uploadResponse)
      this.logger.forBot().error('Failed to upload image binary to LinkedIn', {
        status: uploadResponse.status,
        ...headers,
      })
      throw new sdk.RuntimeError(
        `Failed to upload image to LinkedIn (status: ${uploadResponse.status}, x-li-uuid: ${headers['x-li-uuid']})`
      )
    }
  }
}
