import { getZendeskClient } from '../client'
import * as bp from '.botpress'

export const createUser: bp.IntegrationProps['actions']['createUser'] = async ({
  ctx,
  client: bpClient,
  input,
  logger,
}) => {
  const zendeskClient = getZendeskClient(ctx.configuration)

  const { name, email, pictureUrl } = input

  const { user } = await bpClient.getOrCreateUser({
    name,
    pictureUrl,
    tags: {
      email,
      role: 'end-user',
    },
    discriminateByTags: ['email'],
  })

  const encodedPictureUrl = pictureUrl && encodeURI(pictureUrl)

  let remote_photo_url = pictureUrl

  const urlLength = _getEncodedLength(encodedPictureUrl)
  if (urlLength && urlLength > 255) {
    // Zendesk has a limit of 255 characters for the remote_photo_url
    logger.forBot().warn(`Picture URL is too long (${urlLength} characters). It will not be set in Zendesk.`)
    remote_photo_url = ''
  }

  const zendeskUser = await zendeskClient.createOrUpdateUser({
    role: 'end-user',
    external_id: user.id,
    name,
    remote_photo_url,
    email,
  })

  await bpClient.updateUser({
    id: user.id,
    name,
    pictureUrl,
    tags: {
      id: `${zendeskUser.id}`,
    },
  })

  return {
    userId: user.id,
  }
}

const _getEncodedLength = (url: string | undefined): number | undefined => (url ? encodeURI(url).length : undefined)
