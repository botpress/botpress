import { Intent, Position, Toaster } from '@blueprintjs/core'
import _ from 'lodash'

export enum Timeout {
  SHORT = 1000,
  MEDIUM = 3000,
  LONG = 5000
}

export const toastSuccess = (
  message: string,
  timeout: Timeout = Timeout.SHORT,
  onDismiss?: (didTimeoutExpire: boolean) => void
) => toast(message, Intent.SUCCESS, timeout, onDismiss)

export const toastFailure = (
  message: string,
  timeout: Timeout = Timeout.MEDIUM,
  onDismiss?: (didTimeoutExpire: boolean) => void,
  // Must be delayed when used in a lifecycle event (eg: useEffect)
  options?: { delayed: boolean }
) => toast(message, Intent.DANGER, timeout, onDismiss, options)

export const toastInfo = (
  message: string,
  timeout: Timeout = Timeout.MEDIUM,
  onDismiss?: (didTimeoutExpire: boolean) => void
) => toast(message, Intent.PRIMARY, timeout, onDismiss)

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
