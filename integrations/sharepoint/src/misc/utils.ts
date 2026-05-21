import { RuntimeError } from '@botpress/sdk'
import { AxiosError } from 'axios'

export const handleAxiosError = (error: AxiosError): never => {
  if (error.response) {
    const body = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data)
    throw new RuntimeError(`SharePoint API ${error.response.status}: ${body.slice(0, 500)}`)
  } else if (error.request) {
    throw new RuntimeError(`SharePoint API no response: ${error.message}`)
  } else {
    throw new RuntimeError(`SharePoint API error: ${error.message}`)
  }
}

export const formatPrivateKey = (privateKey: string): string => {
  const trimmed = privateKey.trim()
  const headerMatch = trimmed.match(/-----BEGIN ([^-]+)-----/)
  if (headerMatch) {
    const keyType = headerMatch[1]
    const stripped = trimmed.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
    return `-----BEGIN ${keyType}-----\n${stripped}\n-----END ${keyType}-----`
  }
  const stripped = trimmed.replace(/\s+/g, '')
  return `-----BEGIN PRIVATE KEY-----\n${stripped}\n-----END PRIVATE KEY-----`
}
