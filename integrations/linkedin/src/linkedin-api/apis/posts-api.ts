import * as sdk from '@botpress/sdk'
import { LinkedInBaseApi } from '../base-api'
import { extractLinkedInHeaders } from '../linkedin-oauth-client'

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024 // 8MB
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif']

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

type InitializeUploadResponse = {
  value: {
    uploadUrl: string
    image: string
  }
}

export class PostsApi extends LinkedInBaseApi {
  public async createPost(params: CreatePostParams): Promise<CreatePostResult> {
    const { authorUrn, text, visibility = 'PUBLIC', imageUrl, articleUrl, articleTitle, articleDescription } = params

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

    const response = await this.requestWithErrorHandling(
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

    await this.requestWithErrorHandling(
      `/posts/${encodedUrn}`,
      { method: 'DELETE' },
      'Failed to delete LinkedIn post',
      { successStatuses: [204, 404] } // 204 = success, 404 = already deleted (treat as success)
    )
  }

  private async _uploadImageFromUrl(imageUrl: string, authorUrn: string): Promise<string> {
    const imageBuffer = await this._downloadAndValidateImage(imageUrl)
    const { uploadUrl, imageUrn } = await this._initializeImageUpload(authorUrn)
    await this._uploadImageBinary(uploadUrl, imageBuffer)
    return imageUrn
  }

  private async _downloadAndValidateImage(imageUrl: string): Promise<ArrayBuffer> {
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new sdk.RuntimeError(`Failed to download image from URL: ${imageUrl} (status: ${imageResponse.status})`)
    }

    const contentType = imageResponse.headers.get('content-type')?.toLowerCase() || ''
    const contentLength = imageResponse.headers.get('content-length')

    const isValidType = SUPPORTED_IMAGE_TYPES.some((type) => contentType.includes(type))
    if (!isValidType) {
      throw new sdk.RuntimeError(`Unsupported image format: ${contentType}. LinkedIn supports: JPG, PNG, GIF.`)
    }

    if (contentLength) {
      const size = parseInt(contentLength, 10)
      if (size > MAX_IMAGE_SIZE_BYTES) {
        throw new sdk.RuntimeError(`Image size (${Math.round(size / 1024 / 1024)}MB) exceeds LinkedIn's 8MB limit.`)
      }
    }

    const imageBuffer = await imageResponse.arrayBuffer()

    if (imageBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
      throw new sdk.RuntimeError(
        `Image size (${Math.round(imageBuffer.byteLength / 1024 / 1024)}MB) exceeds LinkedIn's 8MB limit.`
      )
    }

    return imageBuffer
  }

  private async _initializeImageUpload(authorUrn: string): Promise<{ uploadUrl: string; imageUrn: string }> {
    const response = await this.requestWithErrorHandling(
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

    const data = (await response.json()) as InitializeUploadResponse

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
      throw new sdk.RuntimeError(
        `Failed to upload image to LinkedIn (status: ${uploadResponse.status}, x-li-uuid: ${headers['x-li-uuid']})`
      )
    }
  }
}
