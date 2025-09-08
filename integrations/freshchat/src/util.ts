import * as bp from '../.botpress'
import { getFreshchatClient } from './client'

type IntegrationUser = Awaited<ReturnType<bp.Client['getUser']>>['user']

export const updateAgentUser = async (
  user: IntegrationUser,
  client: bp.Client,
  ctx: bp.Context,
  logger: bp.Logger,
  forceUpdate?: boolean
): Promise<{ updatedAgentUser: IntegrationUser }> => {
  if (!forceUpdate && user?.name?.length) {
    return { updatedAgentUser: user }
  }

  let updatedFields: Record<string, any> = {}

  try {
    const freshchatClient = getFreshchatClient({ ...ctx.configuration }, logger)
    const agentData = await freshchatClient.getAgentById(user.tags.id as string)
    updatedFields = {
      name: agentData?.first_name + ' ' + agentData?.last_name,
      ...(agentData?.avatar?.url?.length && { pictureUrl: agentData?.avatar?.url }),
    }
  } catch (thrown) {
    const err = thrown instanceof Error ? thrown : new Error(String(thrown))
    logger.forBot().error(`Couldn't get the agent profile from Freshchat: ${err.message}`)
  }

  if (!updatedFields?.pictureUrl?.length && ctx.configuration?.agentAvatarUrl?.length) {
    updatedFields.pictureUrl = ctx.configuration.agentAvatarUrl
  }

  if (updatedFields.name !== user.name || updatedFields.pictureUrl !== user.pictureUrl) {
    const { user: updatedUser } = await client.updateUser({
      ...user,
      ...updatedFields,
    })
    return { updatedAgentUser: updatedUser }
  }

  return { updatedAgentUser: user }
}

export type FileMetadata = { mimeType: string; fileSize?: number; fileName?: string }

export async function getMediaMetadata(url: string): Promise<FileMetadata> {
  const response = await fetch(url, { method: 'HEAD' })

  if (!response.ok) {
    throw new Error(`Failed to fetch metadata for URL: ${url}`)
  }

  const mimeType = response.headers.get('content-type') ?? 'application/octet-stream'
  const contentLength = response.headers.get('content-length')
  const contentDisposition = response.headers.get('content-disposition')

  const fileSize = contentLength ? Number(contentLength) : undefined
  if (fileSize !== undefined && isNaN(fileSize)) {
    throw new Error(`Failed to parse file size from response: ${contentLength}`)
  }

  // Try to extract filename from content-disposition
  let fileName: string | undefined
  if (contentDisposition) {
    const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?"?([^"]+)"?/i)
    const rawFileName = match?.[1]
    if (rawFileName) {
      fileName = decodeURIComponent(rawFileName)
    }
  }

  return {
    mimeType,
    fileSize,
    fileName,
  }
}
