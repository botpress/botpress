import * as bp from '.botpress'

export type Carousel = bp.channels.channel.carousel.Carousel
export type Card = bp.channels.channel.card.Card
export type Choice = bp.channels.channel.choice.Choice
export type Dropdown = bp.channels.channel.dropdown.Dropdown
export type Location = bp.channels.channel.location.Location

export type MessengerAttachment = MessengerPostbackAttachment | MessengerSayAttachment | MessengerUrlAttachment

type MessengerPostbackAttachment = {
  type: 'postback'
  title: string
  payload: string
}

type MessengerSayAttachment = {
  type: 'postback'
  title: string
  payload: string
}

type MessengerUrlAttachment = {
  type: 'web_url'
  title: string
  url: string
}

export type MessengerPayload = {
  object: string
  entry: MessengerEntry[]
}

type MessengerEntry = {
  id: string
  time: number
  messaging: MessengerMessage[]
}

export type MessengerMessage = {
  sender: { id: string }
  recipient: { id: string }
  timestamp: number
  message?: {
    mid: string
    text: string
    quick_reply?: { payload: string }
    attachments?: { type: string; payload: { url: string } }[]
  }
  postback?: {
    mid: string
    payload: string
    title: string
  }
}
