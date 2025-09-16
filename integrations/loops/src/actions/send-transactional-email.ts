import { RuntimeError } from '@botpress/sdk'
import axios from 'axios'
import { LoopsApi, TransactionalEmailAttachment } from 'src/loops.api'
import * as bp from '.botpress'

const _getAndEncodeFileData = async (url: string, logger: bp.Logger): Promise<string> => {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    })

    return Buffer.from(response.data).toString('base64')
  } catch (error) {
    logger.error('An error occurred when trying to get and encode file data from URL:', error)

    if (axios.isAxiosError(error)) {
      if (!error.response) {
        throw new RuntimeError('A network error occurred when trying to get and encode file data from URL.')
      }

      throw new RuntimeError('An HTTP error occurred when trying to get and encode file data from URL.')
    }

    throw new RuntimeError('An unexpected error occurred when trying to get and encode file data from URL.')
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
        data: await _getAndEncodeFileData(file.url, logger),
      }
    })
  )

  logger.info('These are the file attachments to be sent:', { fileAttachments })

  return fileAttachments
}

export const sendTransactionalEmail: bp.IntegrationProps['actions']['sendTransactionalEmail'] = async (props) => {
  const logger = props.logger.forBot()

  const {
    input: { email, transactionalId, dataVariables: dataVariableEntries, addToAudience, idempotencyKey, fileIds },
    ctx: {
      configuration: { apiKey },
    },
    client,
  } = props

  logger.info('This is the data variables:', { dataVariableEntries })

  const dataVariables = dataVariableEntries?.reduce((acc: Record<string, string>, item) => {
    acc[item.key] = item.value
    return acc
  }, {})

  logger.info('This is the parsed data variables for the API request:', { dataVariables })

  const requestBody = {
    email,
    transactionalId,
    addToAudience,
    idempotencyKey,
    dataVariables: Object.keys(dataVariables).length > 0 ? dataVariables : undefined,
    attachments: fileIds && fileIds.length > 0 ? await _getAttachmentsByFileIds(fileIds, client, logger) : undefined,
  }

  logger.info('This is the request body:', (({ attachments, ...requestBody }) => requestBody)(requestBody))
  logger.info('These are the attachments:', requestBody.attachments)

  const loops = new LoopsApi(apiKey, logger)
  return await loops.sendTransactionalEmail(requestBody)
}
