import { InjectedIntl } from 'react-intl'
import snarkdown from 'snarkdown'
import { MessageType } from 'typings'

export const messageTypes = [
  'text',
  'audio',
  'video',
  'file',
  'dropdown',
  'visit',
  'voice',
  'typing',
  'carousel',
  'login_prompt',
  'quick_reply',
  'session_reset',
  'custom'
] as const

export const isSupportedMessageType = (type: string | MessageType): boolean => {
  return (type as string) in messageTypes
}

export const renderUnsafeHTML = (message: string = '', escaped: boolean): string => {
  if (escaped) {
    message = message.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  const html = snarkdown(message)
  return html.replace(/<a href/gi, '<a target="_blank" href')
}

export class FallthroughIntl implements InjectedIntl {
  formats: any
  messages: { [id: string]: string } = {}
  defaultLocale: string = 'en'
  defaultFormats: any
  constructor(public locale: string = 'en') {}

  formatDate(value: ReactIntl.DateSource, options?: ReactIntl.IntlComponent.DateTimeFormatProps): string {
    throw new Error('Method not implemented.')
  }
  formatTime(value: ReactIntl.DateSource, options?: ReactIntl.IntlComponent.DateTimeFormatProps): string {
    throw new Error('Method not implemented.')
  }
  formatRelative(value: ReactIntl.DateSource, options?: ReactIntl.FormattedRelative.PropsBase & { now?: any }): string {
    throw new Error('Method not implemented.')
  }
  formatNumber(value: number, options?: ReactIntl.FormattedNumber.PropsBase): string {
    throw new Error('Method not implemented.')
  }
  formatPlural(value: number, options?: ReactIntl.FormattedPlural.Base): keyof ReactIntl.FormattedPlural.PropsBase {
    throw new Error('Method not implemented.')
  }

  formatMessage(
    messageDescriptor: ReactIntl.FormattedMessage.MessageDescriptor,
    values?: { [key: string]: ReactIntl.MessageValue }
  ): string {
    return messageDescriptor.defaultMessage || 'Missing default message'
  }

  formatHTMLMessage(
    messageDescriptor: ReactIntl.FormattedMessage.MessageDescriptor,
    values?: { [key: string]: ReactIntl.MessageValue }
  ): string {
    throw new Error('Method not implemented.')
  }
  now(): number {
    throw new Error('Method not implemented.')
  }
  onError(error: string): void {
    throw new Error('Method not implemented.')
  }
}
