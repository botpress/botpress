import type { User } from '@botpress/client'
import type { UserResolver } from '../user-resolver'
import type { Message } from './message-types'

export type MessageTextOutput = {
  user: User
  isBot: boolean
  text: string[]
}

export type MessageFormatter<
  TMessageType extends Message['type'] = Message['type'],
  TMessage extends Extract<Message, { type: TMessageType }> = Extract<Message, { type: TMessageType }>,
> = {
  formatMessage(message: TMessage): Promise<string[]> | string[]
}

export class MessageTextExtractor {
  private readonly _userResolver: UserResolver
  private readonly _botUserId: string
  private readonly _messageFormatters: { [K in Message['type']]: MessageFormatter }

  public constructor({
    userResolver,
    botUserId,
    customFormatters,
  }: {
    userResolver: UserResolver
    botUserId: string
    customFormatters?: { [K in Message['type']]?: MessageFormatter }
  }) {
    this._userResolver = userResolver
    this._botUserId = botUserId

    const _customFormatters = customFormatters ?? {}
    this._messageFormatters = {
      text: _customFormatters.text ?? DEFAULT_TEXT_FORMATTER,
      image: _customFormatters.image ?? DEFAULT_IMAGE_FORMATTER,
      audio: _customFormatters.audio ?? DEFAULT_AUDIO_FORMATTER,
      video: _customFormatters.video ?? DEFAULT_VIDEO_FORMATTER,
      file: _customFormatters.file ?? DEFAULT_FILE_FORMATTER,
      location: _customFormatters.location ?? DEFAULT_LOCATION_FORMATTER,
      dropdown: _customFormatters.dropdown ?? DEFAULT_DROPDOWN_FORMATTER,
      choice: _customFormatters.choice ?? DEFAULT_CHOICE_FORMATTER,
      card: _customFormatters.card ?? DEFAULT_CARD_FORMATTER,
      markdown: _customFormatters.markdown ?? DEFAULT_MARKDOWN_FORMATTER,
      bloc: _customFormatters.bloc ?? DEFAULT_BLOC_FORMATTER,
      carousel: _customFormatters.carousel ?? DEFAULT_CAROUSEL_FORMATTER,
    }
  }

  public async extractTextFromMessages(messages: Message[]): Promise<MessageTextOutput[]> {
    return await Promise.all(messages.map(this.extractTextFromMessage.bind(this)))
  }

  public async extractTextFromMessage(message: Message): Promise<MessageTextOutput> {
    const user = await this._getUser(message.source)
    const text = await this._formatMessageContent(message)

    return { user, isBot: message.source.type === 'bot', text }
  }

  private async _getUser(messageSource: Message['source']): Promise<User> {
    const { user } = await this._userResolver.getUser({
      id: messageSource.type === 'user' ? messageSource.userId : this._botUserId,
    })
    return user
  }

  private async _formatMessageContent(message: Message): Promise<string[]> {
    const formatter = this._messageFormatters[message.type]
    const formattedMessage = await formatter.formatMessage(message)
    return formattedMessage
  }
}

const DEFAULT_TEXT_FORMATTER: MessageFormatter<'text'> = {
  formatMessage: (message) => _normalizeLineEndings(message.payload.text).split('\n'),
}

const DEFAULT_MARKDOWN_FORMATTER: MessageFormatter<'markdown'> = {
  formatMessage: (message) => _normalizeLineEndings(message.payload.markdown).split('\n'),
}

const _normalizeLineEndings = (text: string): string => {
  return text.trim().replaceAll('\r\n', '\n')
}

const DEFAULT_IMAGE_FORMATTER: MessageFormatter<'image'> = {
  formatMessage: (message) => [`[ Image: ${message.payload.imageUrl} ]`],
}

const DEFAULT_AUDIO_FORMATTER: MessageFormatter<'audio'> = {
  formatMessage: (message) => [`[ Audio: ${message.payload.audioUrl} ]`],
}

const DEFAULT_VIDEO_FORMATTER: MessageFormatter<'video'> = {
  formatMessage: (message) => [`[ Video: ${message.payload.videoUrl} ]`],
}

const DEFAULT_FILE_FORMATTER: MessageFormatter<'file'> = {
  formatMessage: (message) => [`[ File - ${message.payload.title ?? 'untitled'}: ${message.payload.fileUrl} ]`],
}

const DEFAULT_LOCATION_FORMATTER: MessageFormatter<'location'> = {
  formatMessage: (message) => {
    const parts = ['[ Location ]']

    if (message.payload.title) {
      parts.push(message.payload.title)
    }

    if (message.payload.address) {
      parts.push(..._normalizeLineEndings(message.payload.address).split('\n'))
    }

    parts.push(`${message.payload.latitude}° N, ${message.payload.longitude}° W`)

    return parts
  },
}

const DEFAULT_DROPDOWN_FORMATTER: MessageFormatter<'dropdown'> = {
  formatMessage: (message) => ['[ Dropdown options ]', ...message.payload.options.map(_formatOption)],
}

const DEFAULT_CHOICE_FORMATTER: MessageFormatter<'choice'> = {
  formatMessage: (message) => ['[ Choice options ]', ...message.payload.options.map(_formatOption)],
}

const _formatOption = (option: { label: string; value: string }): string => {
  return `"${option.label}" (${option.value})`
}

const DEFAULT_CARD_FORMATTER: MessageFormatter<'card'> = {
  formatMessage: (message) => {
    const parts = [`[ Card: "${message.payload.title}" ]`]

    if (message.payload.subtitle) {
      parts.push(`Subtitle: ${message.payload.subtitle}`)
    }

    if (message.payload.imageUrl) {
      parts.push(`Image: ${message.payload.imageUrl}`)
    }

    if (message.payload.actions.length) {
      parts.push(...message.payload.actions.map(_formatAction))
    }

    return parts
  },
}

const _formatAction = (action: { action: string; label: string; value: string }): string => {
  return `${action.action}: "${action.label}" => ${action.value}`
}

const DEFAULT_BLOC_FORMATTER: MessageFormatter<'bloc'> = {
  // Not implemented yet
  formatMessage: () => ['[ Bloc ]'],
}

const DEFAULT_CAROUSEL_FORMATTER: MessageFormatter<'carousel'> = {
  // Not implemented yet
  formatMessage: () => ['[ Carousel ]'],
}
