import * as sdk from '@botpress/sdk'

type AllMessageTypes = typeof sdk.messages.defaults & { markdown: typeof sdk.messages.markdown }

export type Message = {
  [K in keyof AllMessageTypes]: {
    type: K
    source:
      | {
          type: 'user'
          userId: string
        }
      | {
          type: 'bot'
        }
    payload: sdk.z.infer<AllMessageTypes[K]['schema']>
  }
}[keyof AllMessageTypes]

export type MessageSource = Message['source']

export type TextMessage = Extract<Message, { type: 'text' }>
export type ImageMessage = Extract<Message, { type: 'image' }>
export type AudioMessage = Extract<Message, { type: 'audio' }>
export type VideoMessage = Extract<Message, { type: 'video' }>
export type FileMessage = Extract<Message, { type: 'file' }>
export type LocationMessage = Extract<Message, { type: 'location' }>
export type CarouselMessage = Extract<Message, { type: 'carousel' }>
export type CardMessage = Extract<Message, { type: 'card' }>
export type DropdownMessage = Extract<Message, { type: 'dropdown' }>
export type ChoiceMessage = Extract<Message, { type: 'choice' }>
export type BlocMessage = Extract<Message, { type: 'bloc' }>
export type MarkdownMessage = Extract<Message, { type: 'markdown' }>
