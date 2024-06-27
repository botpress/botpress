import axios, { AxiosError } from 'axios'
import { isNode } from 'browser-or-node'
import http from 'http'
import https from 'https'
import * as config from './config'
import * as errors from './errors'
import * as gen from './gen'
import * as types from './types'

const _100mb = 100 * 1024 * 1024
const maxBodyLength = _100mb
const maxContentLength = _100mb

export class Client extends gen.Client implements types.IClient {
  public readonly config: Readonly<types.ClientConfig>

  public constructor(clientProps: types.ClientProps = {}) {
    const clientConfig = config.getClientConfig(clientProps)
    const { apiUrl, headers, withCredentials, timeout } = clientConfig
    const axiosInstance = axios.create({
      baseURL: apiUrl,
      headers,
      withCredentials,
      timeout,
      maxBodyLength,
      maxContentLength,
      httpAgent: isNode ? new http.Agent({ keepAlive: true }) : undefined,
      httpsAgent: isNode ? new https.Agent({ keepAlive: true }) : undefined,
    })
    super(axiosInstance)

    this.config = clientConfig
  }

  /**
   * Create/update and upload a file in a single step. Returns an object containing the file metadata and the URL to retrieve the file.
   */
  public readonly uploadFile = async ({
    key,
    index,
    tags,
    contentType,
    accessPolicies,
    content,
    url,
  }: types.ClientInputs['uploadFile']): Promise<types.ClientOutputs['uploadFile']> => {
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

    const buffer = content instanceof Buffer ? content : Buffer.from(content)

    const { file } = await this.upsertFile({
      key,
      tags,
      index,
      accessPolicies,
      contentType,
      size: buffer.byteLength,
    })

    try {
      await axios.put(file.uploadUrl, buffer, {
        maxBodyLength: Infinity,
      })
    } catch (err: any) {
      throw new errors.UploadFileError(`Failed to upload file: ${err.message}`, <AxiosError>err, file)
    }

    return { file }
  }
}
