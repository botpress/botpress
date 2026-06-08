import { RuntimeError } from '@botpress/sdk'
import { addAttachmentInputSchema, addAttachmentOutputSchema } from '../misc/custom-schemas'
import type { Implementation } from '../misc/types'
import { getClient, getErrorMessage, serializeErrorForLog } from '../utils'

const _downloadFile = async (fileUrl: string): Promise<{ data: ArrayBuffer; contentType?: string }> => {
  const response = await fetch(fileUrl)
  if (!response.ok) {
    throw new Error(`Failed to download file (${response.status} ${response.statusText})`)
  }

  return {
    data: await response.arrayBuffer(),
    contentType: response.headers.get('content-type') ?? undefined,
  }
}

const _decodeBase64 = (data: string): Buffer => {
  const base64 = data.includes(',') ? data.split(',').pop()! : data
  return Buffer.from(base64, 'base64')
}

export const addAttachment: Implementation['actions']['addAttachment'] = async ({ client, ctx, input, logger }) => {
  const validatedInput = addAttachmentInputSchema.parse(input)
  const jiraClient = await getClient({ client, ctx, logger })

  try {
    if (!validatedInput.fileUrl && !validatedInput.data) {
      throw new RuntimeError('Either fileUrl or data must be provided')
    }

    const file = validatedInput.fileUrl
      ? await _downloadFile(validatedInput.fileUrl)
      : { data: _decodeBase64(validatedInput.data!), contentType: undefined }

    const attachments = await jiraClient.addAttachmentToIssue(validatedInput.issueKey, {
      filename: validatedInput.filename,
      contentType: validatedInput.contentType ?? file.contentType,
      data: file.data,
    })

    logger.forBot().info(`Successful - Add Attachment - ${validatedInput.issueKey} - ${validatedInput.filename}`)
    return addAttachmentOutputSchema.parse({ issueKey: validatedInput.issueKey, attachments })
  } catch (error) {
    logger.forBot().debug(`'Add Attachment' exception ${serializeErrorForLog(error)}`)
    const message = getErrorMessage(error)
    throw new RuntimeError(`Failed to add attachment to issue ${validatedInput.issueKey}: ${message}`)
  }
}
