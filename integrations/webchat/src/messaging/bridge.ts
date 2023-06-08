import type { z } from 'zod'
import type { cardSchema } from './content-types'

type InputActionType = 'postback' | 'url' | 'say'

type CardAction = {
  label: string
  value: string
  action: InputActionType
}

export type Card = {
  title: string
  subtitle?: string
  imageUrl?: string
  actions: CardAction[]
}

export type Choice = { text: string; choices: { title: string; value: string }[] }

export const inputCardToMessagingCard = (card: Card): z.infer<typeof cardSchema> => {
  return {
    title: card.title,
    subtitle: card.subtitle,
    image: card.imageUrl,
    actions: card.actions
      .filter((item) => item.value && item.label)
      .map((a) => {
        switch (a.action) {
          case 'postback':
            return { title: a.label, action: 'Postback', payload: a.value }
          case 'url':
            return { title: a.label, action: 'Open URL', url: a.value }
          case 'say':
            return { title: a.label, action: 'Say something', text: a.value }
          default:
            throw new Error(`Unknown action type ${a.action}`)
        }
      }),
  }
}
