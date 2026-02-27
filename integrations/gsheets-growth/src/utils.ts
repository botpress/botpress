import * as sdk from '@botpress/sdk'

export const extractSpreadsheetId = (url: string): string => {
  const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
  const match = url.match(regex)

  if (!match?.[1]) {
    throw new sdk.RuntimeError('Invalid Google Sheets URL format')
  }

  return match[1]
}

export const extractGidFromUrl = (url: string): string => {
  const gidMatch = url.match(/[?&]gid=([0-9]+)/)
  if (gidMatch?.[1]) {
    return gidMatch[1]
  }

  const hashMatch = url.match(/#gid=([0-9]+)/)
  if (hashMatch?.[1]) {
    return hashMatch[1]
  }

  return '0'
}
