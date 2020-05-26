import { Intent, Position, Toaster } from '@blueprintjs/core'
import _ from 'lodash'

import { lang } from '../translations'

export interface ToastOptions {
  // Delaying to avoid the react lifecycle issue (executing before it is rendered)
  delayed?: boolean
  timeout?: 'short' | 'medium' | 'long'
  onDismiss?: (didTimeoutExpire: boolean) => void
}

const prepareMessage = (message: string | React.ReactElement, details?: string) =>
  typeof message === 'string' ? lang(message, { details }) : message

const success = (
  message: string | React.ReactElement,
  details?: string,
  options: ToastOptions = {
    delayed: false,
    timeout: 'short'
  }
) => showToast(prepareMessage(message, details), Intent.SUCCESS, options)

const failure = (
  message: string | React.ReactElement,
  details?: string,
  options: ToastOptions = {
    delayed: true,
    timeout: 'medium'
  }
) => {
  showToast(prepareMessage(message, details), Intent.DANGER, options)
}

const info = (
  message: string | React.ReactElement,
  details?: string,
  options: ToastOptions = {
    delayed: false,
    timeout: 'short'
  }
) => showToast(prepareMessage(message, details), Intent.PRIMARY, options)

const warning = (
  message: string | React.ReactElement,
  details?: string,
  options: ToastOptions = {
    delayed: false,
    timeout: 'medium'
  }
) => showToast(prepareMessage(message, details), Intent.WARNING, options)

const showToast = (message: string | React.ReactElement, intent, options?: ToastOptions) => {
  let timeout = 1000
  if (options?.timeout === 'medium') {
    timeout = 3000
  } else if (options?.timeout === 'long') {
    timeout = 5000
  }

  const showToast = () => {
    Toaster.create({ className: 'recipe-toaster', position: Position.TOP_RIGHT }).show({
      message: typeof message === 'string' ? lang(message) : message,
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

export const toast = { success, failure, warning, info }
