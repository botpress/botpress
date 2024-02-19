import { AtLeastOne } from 'whatsapp-api-js/lib/types/utils'
import { Text, Interactive, ActionButtons, Header, Image, Button } from 'whatsapp-api-js/messages'
import * as body from '../interactive/body'
import * as button from '../interactive/button'
import * as footer from '../interactive/footer'
import { UnreachableCaseError, chunkArray } from '../util'
import type { channels } from '.botpress'

type Card = channels.channel.card.Card

type SDKAction = Card['actions'][number]
type ActionURL = SDKAction & { action: 'url' }
type ActionSay = SDKAction & { action: 'say' }
type ActionPostback = SDKAction & { action: 'postback' }

type Action = ActionSay | ActionURL | ActionPostback

const POSTBACK_PREFIX = 'p:'
const SAY_PREFIX = 's:'

const INTERACTIVE_MAX_BUTTONS_COUNT = 3

export function* generateOutgoingMessages(card: Card) {
  const actions = card.actions as Action[]

  if (actions.length === 0) {
    // No actions, so we can't display an interactive message
    for (const m of generateHeader(card)) {
      yield m
    }
    return
  }

  // We have to split the actions into two groups: URL actions and other actions
  const urlActions = actions.filter(isActionURL)
  const nonUrlActions = actions.filter(isNotActionUrl)

  if (urlActions.length === 0) {
    // All actions are either postback or say, we can display an interactive message
    for (const m of generateInteractiveMessages(card, nonUrlActions)) {
      yield m
    }
    return
  }

  if (nonUrlActions.length === 0) {
    // All actions are URL, we can't display an interactive message
    for (const m of generateHeader(card)) {
      yield m
    }

    for (const action of urlActions) {
      yield new Text(`${action.label}: ${action.value}`)
    }
    return
  }

  // We have have a mix of URL, postback and say actions
  // We can display an interactive message with the postback and say actions
  // and display the URL actions as text
  for (const m of generateInteractiveMessages(card, nonUrlActions)) {
    yield m
  }

  for (const action of urlActions) {
    yield new Text(`${action.label}: ${action.value}`)
  }
}

function* generateHeader(card: Card) {
  if (card.imageUrl) {
    yield new Image(card.imageUrl, false, card.title)
  } else {
    yield new Text(card.title)
  }

  if (card.subtitle) {
    yield new Text(card.subtitle)
  }
}

function isActionURL(action: Action): action is ActionURL {
  return action.action === 'url'
}

function isNotActionUrl(action: Action): action is ActionSay | ActionPostback {
  return !isActionURL(action)
}

function* generateInteractiveMessages(card: Card, nonURLActions: Action[]) {
  const [firstChunk, ...followingChunks] = chunkArray(nonURLActions, INTERACTIVE_MAX_BUTTONS_COUNT)
  if (firstChunk) {
    const buttons: Button[] = createButtons(firstChunk)
    yield new Interactive(
      new ActionButtons(...(buttons as AtLeastOne<Button>)),
      body.create(card.title),
      card.imageUrl ? new Header(new Image(card.imageUrl, false)) : undefined,
      card.subtitle ? footer.create(card.subtitle) : undefined
    )
  }

  if (followingChunks) {
    for (const chunk of followingChunks) {
      const buttons: Button[] = createButtons(chunk)
      yield new Interactive(new ActionButtons(...(buttons as AtLeastOne<Button>)), body.create(card.title))
    }
  }
}

function createButtons(nonURLActions: Action[]) {
  const buttons: Button[] = []
  for (const action of nonURLActions) {
    switch (action.action) {
      case 'postback':
        buttons.push(button.create({ id: `${POSTBACK_PREFIX}${action.value}`, title: action.label }))
        break
      case 'say':
        buttons.push(button.create({ id: `${SAY_PREFIX}${action.value}`, title: action.label }))
        break
      case 'url':
        // TODO implement support for URL actions
        throw new Error('URL actions not implemented yet')
      default:
        throw new UnreachableCaseError(action)
    }
  }
  return buttons
}
