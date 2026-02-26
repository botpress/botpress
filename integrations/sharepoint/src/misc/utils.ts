import { RuntimeError } from '@botpress/sdk'
import axios, { AxiosError } from 'axios'
import { merge } from 'lodash'

export const handleAxiosError = (error: AxiosError) => {
  // Handle the error
  if (error.response) {
    // Server responded with a status other than 2xx
    console.log('Error status:', error.response.status)
    console.log('Error data:', error.response.data)
  } else if (error.request) {
    // Request was made, but no response was received
    console.log('No response received:', error.request)
  } else {
    // Something else went wrong
    console.log('Error message:', error.message)
  }
}

export const stringToArrayBuffer = (str: string): ArrayBufferLike => {
  const encoder = new TextEncoder()
  return encoder.encode(str).buffer
}

export const getFormatedCurrTime = (): string => {
  const date = new Date()
  const timeParts = date.toLocaleTimeString().split(' ')
  const time = timeParts[0]
  const period = timeParts[1] || '' // Handles cases without AM/PM

  return `${time}.${date.getMilliseconds().toString().padStart(3, '0')} ${period}`
}

/**
 * A helper function to format the private key in the RS256 format ( There is probably a better way to do this ... )
 * @param privateKey
 * @returns
 */
export const formatPrivateKey = (privateKey: string) => {
  return `-----BEGIN PRIVATE KEY-----\n${privateKey.split(' ').join('\n')}\n-----END PRIVATE KEY-----`
}

export const guessMimeType = (filename: string): string => {
  const ext = filename.toLowerCase().split('.').pop() ?? ''
  switch (ext) {
    case 'txt':
      return 'text/plain'
    case 'html':
      return 'text/html'
    case 'pdf':
      return 'application/pdf'
    case 'doc':
      return 'application/msword'
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case 'md':
      return 'text/markdown'
    default:
      return 'application/octet-stream'
  }
}

export const mergeKBMapping = (mapping1: string, mapping2: string): string => {
  try {
    const map1 = JSON.parse(mapping1)
    const map2 = JSON.parse(mapping2)

    const merged = merge({}, map1, map2)

    return JSON.stringify(merged)
  } catch (error) {
    throw new RuntimeError(`Error parsing KB maps: ${error}`)
  }
}
