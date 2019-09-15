import { Intent, Position, Toaster } from '@blueprintjs/core'
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

export const toastSuccess = message =>
  Toaster.create({ className: 'recipe-toaster', position: Position.TOP }).show({
    message,
    intent: Intent.SUCCESS,
    timeout: 1000
  })

export const toastFailure = message =>
  Toaster.create({ className: 'recipe-toaster', position: Position.TOP }).show({
    message,
    intent: Intent.DANGER,
    timeout: 3500
  })
