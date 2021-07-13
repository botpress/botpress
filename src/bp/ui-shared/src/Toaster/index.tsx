import { IconName, Intent, IToasterProps, Position, Toaster } from '@blueprintjs/core'
import _ from 'lodash'

import { lang } from '../translations'

import style from './style.scss'

export interface ToastOptions {
  // Delaying to avoid the react lifecycle issue (executing before it is rendered)
  delayed?: boolean
  timeout?: 'short' | 'medium' | 'long' | 'infinite'
  icon?: IconName | JSX.Element
  hideDismiss?: boolean
  key?: string
  toasterProps?: IToasterProps
  onDismiss?: (didTimeoutExpire: boolean) => void
}

const defaultToaster = Toaster.create({ className: style.toaster, position: Position.BOTTOM })
const toastKeys = {}

const prepareMessage = (message: string | React.ReactElement, details?: string) =>
  typeof message === 'string' ? lang(message, { details }) : message

const successOptions = {
  delayed: false,
  timeout: 'medium',
  icon: 'tick-circle',
  key: 'success'
}

const failureOptions = {
  delayed: true,
  timeout: 'medium',
  icon: 'error',
  key: 'error'
}

const infoOptions = {
  delayed: false,
  timeout: 'medium',
  icon: 'info-sign',
  key: 'info'
}

const warningOptions = {
  delayed: false,
  timeout: 'medium',
  icon: 'warning-sign',
  key: 'warning'
}

function selectToaster(options?: IToasterProps) {
  if (options) {
    options.className = style.toaster
    return Toaster.create(options)
  } else {
    return defaultToaster
  }
}

const dismiss = (key: string, options?: IToasterProps) => {
  if (!toastKeys[key]) {
    return
  }

  selectToaster(options).dismiss(toastKeys[key])
}

const success = (message: string | React.ReactElement, details?: string, options?: ToastOptions) =>
  showToast(prepareMessage(message, details), Intent.SUCCESS, Object.assign(successOptions, options))

const failure = (message: string | React.ReactElement, details?: string, options?: ToastOptions) => {
  showToast(prepareMessage(message, details), Intent.DANGER, Object.assign(failureOptions, options))
}

const info = (message: string | React.ReactElement, details?: string, options?: ToastOptions) =>
  showToast(prepareMessage(message, details), Intent.PRIMARY, Object.assign(infoOptions, options))

const warning = (message: string | React.ReactElement, details?: string, options?: ToastOptions) =>
  showToast(prepareMessage(message, details), Intent.WARNING, Object.assign(warningOptions, options))

const showToast = (message: string | React.ReactElement, intent, options: ToastOptions) => {
  let timeout = 1000
  if (options.timeout === 'medium') {
    timeout = 3000
  } else if (options.timeout === 'long') {
    timeout = 5000
  } else if (options.timeout === 'infinite') {
    timeout = 0
  }

  const showToast = () => {
    dismiss(options.key!, options.toasterProps)

    toastKeys[options.key!] = selectToaster(options.toasterProps).show({
      message: typeof message === 'string' ? lang(message) : message,
      intent,
      timeout,
      icon: options.icon,
      className: options.hideDismiss ? style.hideDismiss : '',
      onDismiss: options.onDismiss
    })
  }

  if (!options.delayed) {
    showToast()
  } else {
    setTimeout(() => {
      showToast()
    }, 200)
  }
}

export const toast = { dismiss, success, failure, warning, info }
