import { RuntimeError } from '@botpress/client'
import { Card, Choice, Conversation, CreateMessageInputPayload, CreateMessageInputType } from './types'
import * as bp from '.botpress'

/**
 * Gets phone numbers from conversation tags
 */
export function getPhoneNumbers(conversation: Conversation) {
  const to = conversation.tags?.phoneNumber
  const from = conversation.tags?.telnyxNumber

  if (!to) {
    throw new Error('Invalid to phone number')
  }

  if (!from) {
    throw new Error('Invalid from phone number')
  }

  return { to, from }
}

/**
 * Renders choice/dropdown message as text
 */
export function renderChoiceMessage(payload: Choice): string {
  return `${payload.text || ''}\n\n${payload.options.map((o, i) => `${i + 1}. ${o.label}`).join('\n')}`
}

/**
 * Renders card as text
 */
export function renderCard(card: Card, total?: string): string {
  return `${total ? `${total}: ` : ''}${card.title}\n\n${card.subtitle || ''}\n\n${card.actions.map((a, i) => `${i + 1}. ${a.label}`).join('\n')}`
}