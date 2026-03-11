import { RuntimeError } from '@botpress/sdk'
import axios, { type AxiosResponse } from 'axios'

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
  const headerValue = (headers instanceof axios.AxiosHeaders ? headers.get(key) : headers[key]) ?? null
  if (!headerValue) return null

  if (headerValue instanceof axios.AxiosHeaders) {
    throw new RuntimeError("This should never trigger, if it does, IMO it's a bug with the Axios package")
  }

  return Array.isArray(headerValue) ? headerValue : `${headerValue}`
}
