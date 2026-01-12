import * as sdk from '@botpress/sdk'
import { LinkedInOAuthClient, formatLinkedInError, extractLinkedInHeaders } from '../linkedin-api/linkedin-oauth-client'
import * as bp from '.botpress'

const LINKEDIN_REST_BASE = 'https://api.linkedin.com/rest'
const LINKEDIN_API_VERSION = '202511'
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024 // 8MB
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif']

type InitializeUploadResponse = {
  value: {
    uploadUrl: string
    image: string
  }
}

export const createPost: bp.IntegrationProps['actions']['createPost'] = async ({ client, ctx, input, logger }) => {
  const { text, visibility, imageUrl, articleUrl, articleTitle, articleDescription } = input

  const oauthClient = await LinkedInOAuthClient.createFromState({ client, ctx })
  const accessToken = await oauthClient.getAccessToken()
  const linkedInUserId = oauthClient.getUserId()
  const authorUrn = `urn:li:person:${linkedInUserId}`

  let content: Record<string, unknown> | undefined = undefined

  if (imageUrl) {
    logger.forBot().info('Processing image for LinkedIn post...')

    const { imageUrn } = await uploadImage({ imageUrl, authorUrn, accessToken, logger })

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

  const postResponse = await fetch(`${LINKEDIN_REST_BASE}/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      commentary: text,
      visibility,
      distribution: {
        feedDistribution: 'MAIN_FEED',
      },
      ...(content && { content }),
    }),
  })

  if (!postResponse.ok) {
    const errorMsg = await formatLinkedInError(postResponse, 'Failed to create LinkedIn post')
    throw new sdk.RuntimeError(errorMsg)
  }

  const postUrn = postResponse.headers.get('x-restli-id')

  if (!postUrn) {
    throw new sdk.RuntimeError('LinkedIn did not return a post URN in response headers')
  }

  logger.forBot().info('Post created successfully', { postUrn })

  return {
    postUrn,
    postUrl: `https://www.linkedin.com/feed/update/${postUrn}/`,
  }
}

async function uploadImage({
  imageUrl,
  authorUrn,
  accessToken,
  logger,
}: {
  imageUrl: string
  authorUrn: string
  accessToken: string
  logger: bp.Logger
}): Promise<{ imageUrn: string }> {
  // Step 1: Download and validate image from provided URL
  logger.forBot().debug('Downloading image...', { imageUrl })

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

  logger.forBot().debug('Initializing image upload with LinkedIn...')

  const initResponse = await fetch(`${LINKEDIN_REST_BASE}/images?action=initializeUpload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: authorUrn,
      },
    }),
  })

  if (!initResponse.ok) {
    const errorMsg = await formatLinkedInError(initResponse, 'Failed to initialize image upload with LinkedIn')
    throw new sdk.RuntimeError(errorMsg)
  }

  const initData = (await initResponse.json()) as InitializeUploadResponse
  const uploadUrl = initData.value.uploadUrl
  const imageUrn = initData.value.image

  logger.forBot().debug('Uploading image binary...', { imageUrn })

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
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

  logger.forBot().info('Image uploaded successfully', { imageUrn })

  return { imageUrn }
}
