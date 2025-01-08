import * as bp from '.botpress'

export type InstagramPayload = {
  object: string
  entry: InstagramEntry[]
}

export type InstagramEntry = {
  id: string
  time: number
  messaging: InstagramMessage[]
}

export type InstagramMessage = {
  sender: { id: string }
  recipient: { id: string }
  timestamp: number
  message?: {
    mid: string
    text: string
    is_echo: boolean
    quick_reply?: { payload: string }
    attachments?: { type: string; payload: { url: string } }[]
  }
  postback?: {
    mid: string
    payload: string
    title: string
  }
}

export type Carousel = bp.channels.channel.carousel.Carousel
export type Card = bp.channels.channel.card.Card
export type Choice = bp.channels.channel.choice.Choice
export type Dropdown = bp.channels.channel.dropdown.Dropdown
export type Location = bp.channels.channel.location.Location

export type InstagramActionBase = { title: string }

type InstagramActionPostback = {
  type: 'postback'
  title: string
  payload: string
} & InstagramActionBase

type InstagramActionAttachment = {
  type: 'web_url'
  url: string
} & InstagramActionBase

export type InstagramAction = InstagramActionPostback | InstagramActionAttachment

export type TextMessageWithQuickReplies = {
  text: string
  quick_replies?: {
    content_type: string
    title: string
    payload: string
  }[]
}

export type GenericTemplateElement = {
  title: string
  image_url?: string
  subtitle?: string
  default_action?: InstagramAction
  buttons: InstagramAction[]
}

export type GenericTemplateMessage = {
  attachment: {
    type: 'template'
    payload: {
      template_type: 'generic'
      elements: GenericTemplateElement[]
    }
  }
}
