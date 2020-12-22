import crypto from 'crypto'

export const FILENAME_REGEX = /^[0-9a-zA-Z_\-.]+$/
export const ACTION_KEY = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? 'cmd' : 'ctrl'

export const calculateHash = (content?: string) => {
  if (!content) {
    return
  }

  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex')
}

export const sanitizeName = (text: string) =>
  text
    .replace(/\s/g, '-')
    .replace(/[^a-zA-Z0-9\/_.-]/g, '')
    .replace(/\/\//, '/')
