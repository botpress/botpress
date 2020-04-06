import { Intent, Position, Toaster } from '@blueprintjs/core'
import _ from 'lodash'

import { lang } from '../translations'

export enum Timeout {
  SHORT = 1000,
  MEDIUM = 3000,
  LONG = 5000
}

export interface ToastOptions {
  delayed: boolean
  timeout: Timeout
  onDismiss?: (didTimeoutExpire: boolean) => void
}

export const toastFailure = (
  message: string,
  details?: string,
  options: ToastOptions = {
    delayed: false,
    timeout: Timeout.MEDIUM
  }
) => {
  toast(lang(message, { details }), Intent.DANGER, options.timeout, options.onDismiss, options)
}

const toast = (message, intent, timeout, onDismiss, options?) => {
  const showToast = () => {
    Toaster.create({ className: 'recipe-toaster', position: Position.TOP_RIGHT }).show({
      message,
      intent,
      timeout,
      onDismiss
    })
  }

  if (!options?.delayed) {
    showToast()
  } else {
    setTimeout(() => {
      showToast()
    }, 500)
  }
}
