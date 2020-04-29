import { Intent, Position, Toaster } from '@blueprintjs/core'
import _ from 'lodash'

import { lang } from '../translations'

export interface ToastOptions {
  // Delaying to avoid the react lifecycle issue (executing before it is rendered)
  delayed?: boolean
  timeout?: 'short' | 'medium' | 'long'
  onDismiss?: (didTimeoutExpire: boolean) => void
}

const success = (
  message: string,
  details?: string,
  options: ToastOptions = {
    delayed: false,
    timeout: 'short'
  }
) => showToast(lang(message, { details }), Intent.SUCCESS, options)

const failure = (
  message: string,
  details?: string,
  options: ToastOptions = {
    delayed: true,
    timeout: 'medium'
  }
) => {
  showToast(lang(message, { details }), Intent.DANGER, options)
}

const info = (
  message: string,
  details?: string,
  options: ToastOptions = {
    delayed: false,
    timeout: 'short'
  }
) => showToast(lang(message, { details }), Intent.PRIMARY, options)

const showToast = (message: string, intent, options?: ToastOptions) => {
  let timeout = 1000
  if (options?.timeout === 'medium') {
    timeout = 3000
  } else if (options?.timeout === 'long') {
    timeout = 5000
  }

  const showToast = () => {
    Toaster.create({ className: 'recipe-toaster', position: Position.TOP_RIGHT }).show({
      message,
      intent,
      timeout,
      onDismiss: options?.onDismiss
    })
  }

  if (!options?.delayed) {
    showToast()
  } else {
    setTimeout(() => {
      showToast()
    }, 200)
  }
}

export const toast = { success, failure, info }
