import { RuntimeError } from '@botpress/sdk'
import axios from 'axios'
import { LoopsApi, TransactionalEmailAttachment } from 'src/loops.api'
import * as bp from '.botpress'

const _isValidBase64 = (str: string): boolean => {
  try {
    // Check if the string contains only valid base64 characters
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    if (!base64Regex.test(str)) {
      return false
    }

    // Check if the string length is a multiple of 4 (base64 requirement)
    if (str.length % 4 !== 0) {
      return false
    }

    // Try to decode and re-encode to verify it's valid base64
    const decoded = Buffer.from(str, 'base64')
    const reencoded = decoded.toString('base64')

    // Remove padding for comparison since it can vary
    const normalizedOriginal = str.replace(/=+$/, '')
    const normalizedReencoded = reencoded.replace(/=+$/, '')

    return normalizedOriginal === normalizedReencoded
  } catch {
    return false
  }
}

const _encodeFileContentFromUrl = async (url: string, logger: bp.Logger): Promise<string> => {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    })

    return Buffer.from(response.data).toString('base64')
  } catch (error) {
    logger.error('An error occurred when trying to get file content from URL:', error)

    if (axios.isAxiosError(error)) {
      if (!error.response) {
        throw new RuntimeError('A network error occurred when trying to get file content from URL.')
      }

      throw new RuntimeError('An HTTP error occurred when trying to get file content from URL.')
    }

    throw new RuntimeError('An unexpected error occurred when trying to get file content from URL.')
  }
}

const _getAttachmentsByFileIds = async (
  fileIds: string[],
  client: bp.Client,
  logger: bp.Logger
): Promise<TransactionalEmailAttachment[]> => {
  logger.info('These are the file IDs:', { fileIds })

  let files
  try {
    files = await Promise.all(fileIds.map(async (fileId) => client.getFile({ id: fileId })))
  } catch (error) {
    logger.error('An error occurred when getting the files from the Files API:', error)
    throw new RuntimeError('An error occurred when getting the files from the Files API.')
  }

  logger.info(
    'This is information about the files returned by the Files API:',
    files.map(({ file }) => file)
  )

  const fileAttachments = await Promise.all(
    files.map(async ({ file }) => {
      if (!file.size) {
        throw new RuntimeError('File must be uploaded before it can be attached to an email.')
      }

      return {
        filename: file.key,
        contentType: file.contentType,
        data: await _encodeFileContentFromUrl(file.url, logger),
      }
    })
  )

  return fileAttachments
}

export const sendTransactionalEmail: bp.IntegrationProps['actions']['sendTransactionalEmail'] = async (props) => {
  const logger = props.logger.forBot()

  const {
    input: {
      email,
      transactionalId,
      dataVariables: dataVariableEntries,
      addToAudience,
      idempotencyKey,
      fileIds,
      fileData,
    },
    ctx: {
      configuration: { apiKey },
    },
    client,
  } = props

  logger.info('This is the data variables:', { dataVariableEntries })

  const dataVariables = dataVariableEntries?.reduce((acc: Record<string, string>, item) => {
    if (!item.key || !item.value) {
      throw new RuntimeError('Required fields are missing from the data variables.')
    }

    acc[item.key] = item.value
    return acc
  }, {})

  logger.info('This is the parsed data variables for the API request:', { dataVariables })

  const attachments: TransactionalEmailAttachment[] = []

  if (fileIds && fileIds.length > 0) {
    attachments.push(...(await _getAttachmentsByFileIds(fileIds, client, logger)))
  }

  if (fileData) {
    fileData.forEach((file) => {
      if (!file.filename || !file.contentType || !file.data) {
        throw new RuntimeError('Required fields are missing from the file data.')
      }

      if (!_isValidBase64(file.data)) {
        throw new RuntimeError('The encoded data is not a valid base64 string.')
      }
      attachments.push(file)
    })
  }

  const requestBody = {
    email,
    transactionalId,
    addToAudience,
    idempotencyKey,
    dataVariables: Object.keys(dataVariables).length > 0 ? dataVariables : undefined,
    attachments: attachments.length > 0 ? attachments : undefined,
  }

  const loops = new LoopsApi(apiKey, logger)
  return await loops.sendTransactionalEmail(requestBody)
}
