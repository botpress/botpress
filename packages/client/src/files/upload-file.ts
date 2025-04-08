import axios, { AxiosError } from 'axios'
import * as common from '../common'
import { UpsertFileInput, UpsertFileResponse } from '../gen/files/operations/upsertFile'
import * as errors from './errors'

export type UploadFileInput = common.types.Simplify<
  Omit<UpsertFileInput, 'size'> & {
    content?: ArrayBuffer | Buffer | Blob | Uint8Array | string
    url?: string
  }
>

export type UploadFileOutput = UpsertFileResponse

export type UploadFileClient = {
  upsertFile: (input: UpsertFileInput) => Promise<UpsertFileResponse>
}

export const upload = async (
  client: UploadFileClient,
  {
    key,
    index,
    tags,
    contentType,
    accessPolicies,
    content,
    url,
    indexing,
    expiresAt,
    metadata,
    publicContentImmediatelyAccessible,
  }: UploadFileInput
): Promise<UploadFileOutput> => {
  if (url && content) {
    throw new errors.UploadFileError('Cannot provide both content and URL, please provide only one of them')
  }

  if (url) {
    content = await axios
      .get(url, { responseType: 'arraybuffer' })
      .then((res) => res.data)
      .catch((err) => {
        throw new errors.UploadFileError(`Failed to download file from provided URL: ${err.message}`, err)
      })
  }

  if (!content) {
    throw new errors.UploadFileError('No content was provided for the file')
  }

  let buffer: ArrayBuffer | Buffer | Blob | Uint8Array
  let size: number

  if (typeof content === 'string') {
    const encoder = new TextEncoder()
    const uint8Array = encoder.encode(content)
    // Uint8Array is supported by both Node.js and browsers. Buffer.from() is easier but Buffer is only available in Node.js.
    buffer = uint8Array
    size = uint8Array.byteLength
  } else if (content instanceof Uint8Array) {
    // This supports Buffer too as it's a subclass of Uint8Array
    buffer = content
    size = buffer.byteLength
  } else if (content instanceof ArrayBuffer) {
    buffer = content
    size = buffer.byteLength
  } else if (content instanceof Blob) {
    buffer = content
    size = content.size
  } else {
    throw new errors.UploadFileError('The provided content is not supported')
  }

  const { file } = await client.upsertFile({
    key,
    tags,
    index,
    accessPolicies,
    contentType,
    metadata,
    size,
    expiresAt,
    indexing,
    publicContentImmediatelyAccessible,
  })

  const headers: Record<string, string> = {
    'Content-Type': file.contentType,
  }

  if (publicContentImmediatelyAccessible) {
    headers['x-amz-tagging'] = 'public=true'
  }

  try {
    await axios.put(file.uploadUrl, buffer, {
      maxBodyLength: Infinity,
      headers,
    })
  } catch (thrown: unknown) {
    const err = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new errors.UploadFileError(`Failed to upload file: ${err.message}`, err as AxiosError, file)
  }

  return {
    file: {
      ...file,
      size,
    },
  }
}
