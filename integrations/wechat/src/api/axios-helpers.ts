import { RuntimeError } from '@botpress/sdk'
import axios, { type AxiosResponse } from 'axios'
import * as bp from '.botpress'

const NO_CONTENT = 204

export async function httpGetAsBuffer(
  url: string,
  logger: bp.Logger
): Promise<{ data: Buffer; contentType: string } | null> {
  const resp = await axios.get(url, {
    responseType: 'arraybuffer',
    transitional: { forcedJSONParsing: false },
  })

  const content = resp.data
  if (content === undefined || content === null) {
    return null
  }

  if (!(content instanceof Buffer)) {
    const constructorName = content.constructor?.name ?? '<Unknown>'
    // If I understood the Axios docs & configured it correctly, this error should never be thrown
    const errorMsg = `Axios did not convert the response body into a Buffer (Constructor Name: ${constructorName})`
    throw new RuntimeError(errorMsg)
  }

  const contentType = _getContentType(resp.headers, resp.status, logger)
  return { data: content, contentType }
}

/** Performs an Axios get request and parses the response as json based
 *  on the content-type, otherwise the data is formatted into a buffer. */
type JsonOrBufferReturn = { type: 'JSON'; data: object } | { type: 'Buffer'; buffer: Buffer; contentType: string }
export async function httpGetAsJsonOrBuffer(url: string, logger: bp.Logger): Promise<JsonOrBufferReturn | null> {
  const respData = await httpGetAsBuffer(url, logger)
  if (respData === null) return null

  const { data, contentType } = respData
  if (contentType.includes('application/json')) {
    const charset = _getContentCharset(contentType)
    const serializedJSON = _bufferToString(data, charset)
    return { type: 'JSON', data: JSON.parse(serializedJSON) }
  }

  return { type: 'Buffer', buffer: data, contentType }
}

type CommonResponseHeadersList = 'Server' | 'Content-Type' | 'Content-Length' | 'Cache-Control' | 'Content-Encoding'
type ResponseHeaderValue = string | string[] | null

/** Extracts a header value from the Axios headers, and simplifies the output type
 *
 *  @remark This function exists because "AxiosHeaderValue" contains the
 *   "AxiosHeaders" type which creates an indirect circular type reference.
 *  @remark The overloads exist strictly for auto-complete */
export function getHeaderValue(headers: AxiosResponse['headers'], key: CommonResponseHeadersList): ResponseHeaderValue
export function getHeaderValue(headers: AxiosResponse['headers'], key: string): ResponseHeaderValue
export function getHeaderValue(headers: AxiosResponse['headers'], key: string): ResponseHeaderValue {
  const headerValue = headers instanceof axios.AxiosHeaders ? headers.get(key) : headers[key]
  if (headerValue === null || headerValue === undefined) return null

  if (headerValue instanceof axios.AxiosHeaders) {
    throw new RuntimeError("This should never trigger, if it does, IMO it's a bug with the Axios package")
  }

  return Array.isArray(headerValue) ? headerValue : `${headerValue}`
}

const _getContentType = (headers: AxiosResponse['headers'], status: number, logger: bp.Logger) => {
  let contentType = getHeaderValue(headers, 'Content-Type')

  if (Array.isArray(contentType)) {
    // IMO this should never occur, unless WeChat
    // is doing some weird stuff in their Backend
    if (contentType.length > 1) {
      logger.warn(
        `The 'Content-Type' header has multiple values, using first value. All the values are as follows:\n- ${contentType.join('- ')}`
      )
    }

    contentType = contentType[0] ?? null
  }

  if (!contentType) {
    if (status === NO_CONTENT) return 'text/plain'
    throw new Error(`The 'Content-Type' header has not been set (Status code: ${status})`)
  }
  return contentType
}

const _bufferToString = (buffer: Buffer, charset: string = 'utf8') => new TextDecoder(charset).decode(buffer)

const _getContentCharset = (contentType: string) => {
  const pattern = /charset=([^()<>@,;:\"/[\]?.=\s]*)/i
  const charset = pattern.test(contentType) ? pattern.exec(contentType)?.[1] : null
  return charset?.toLowerCase() ?? 'utf8'
}
