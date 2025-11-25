import * as bp from '../../.botpress'

// Types for Sunshine Conversations messaging
export type SmoochBaseAction = {
  type: string
  text: string
}

export type SmoochLinkAction = {
  type: 'link'
  uri: string
} & SmoochBaseAction

export type SmoochPostbackAction = {
  type: 'postback'
  payload: string
} & SmoochBaseAction

export type SmoochReplyAction = {
  type: 'reply'
  payload: string
} & SmoochBaseAction

export type SmoochAction = SmoochLinkAction | SmoochPostbackAction | SmoochReplyAction

export type SmoochCard = {
  title: string
  description?: string
  mediaUrl?: string
  actions: SmoochAction[]
}

export type Choice = bp.channels.messaging.choice.Choice

export type Carousel = bp.channels.messaging.carousel.Carousel

export type SendMessageProps = Pick<bp.AnyMessageProps, 'ctx' | 'conversation' | 'ack'>
