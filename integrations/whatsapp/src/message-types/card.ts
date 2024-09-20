import { ClientTypedMessageComponent } from 'whatsapp-api-js/lib/types/types'
import { AtLeastOne } from 'whatsapp-api-js/lib/types/utils'
import { Text, Interactive, ActionButtons, Header, Image, Button } from 'whatsapp-api-js/messages'
import * as body from '../interactive/body'
import * as button from '../interactive/button'
import * as footer from '../interactive/footer'
import { UnreachableCaseError, chunkArray } from '../util'
import { channels } from '.botpress'

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

  // We have to split the actions into two groups (URL actions and other actions) because buttons are sent differently than URLs
  const urlActions = actions.filter(isActionURL)
  const nonUrlActions = actions.filter(isNotActionUrl)

  if (urlActions.length === 0) {
    // All actions are either postback or say
    for (const m of generateButtonInteractiveMessages(card, nonUrlActions)) {
      yield m
    }
    return
  }

  if (nonUrlActions.length === 0) {
    // All actions are URL
    if (card.imageUrl) {
      yield new Image(card.imageUrl)
    }

    for (const m of generateCTAUrlInteractiveMessages(card, urlActions)) {
      yield m
    }

    return
  }

  // We have have a mix of URL, postback and say actions
  for (const m of generateButtonInteractiveMessages(card, nonUrlActions)) {
    yield m
  }

  for (const m of generateCTAUrlInteractiveMessages(card, urlActions)) {
    yield m
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

function* generateButtonInteractiveMessages(card: Card, actions: Array<ActionSay | ActionPostback>) {
  const [firstChunk, ...followingChunks] = chunkArray(actions, INTERACTIVE_MAX_BUTTONS_COUNT)
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

function createButtons(nonURLActions: Array<ActionSay | ActionPostback>) {
  const buttons: Button[] = []
  for (const action of nonURLActions) {
    switch (action.action) {
      case 'postback':
        buttons.push(button.create({ id: `${POSTBACK_PREFIX}${action.value}`, title: action.label }))
        break
      case 'say':
        buttons.push(button.create({ id: `${SAY_PREFIX}${action.value}`, title: action.label }))
        break
      default:
        throw new UnreachableCaseError(action)
    }
  }
  return buttons
}

function* generateCTAUrlInteractiveMessages(card: Card, actions: ActionURL[]) {
  let actionNumber = 1

  for (const action of actions) {
    if (actionNumber === 1) {
      // First CTA URL button will be in a WhatsApp card
      yield new Interactive(
        new InteractiveCtaUrl(action.value, action.label),
        body.create(card.subtitle ?? action.value),
        card.title ? new Header(card.title) : undefined
      )
    } else {
      // Subsequent CTA URL buttons will be standalone
      yield new Interactive(
        new InteractiveCtaUrl(action.value, action.label),
        body.create('\u200B') // Zero width space character used to force the interactive message to be sent (WhatsApp documentation says body is optional but it's not actually true)
      )
    }

    actionNumber++
  }
}

class InteractiveCtaUrl implements ClientTypedMessageComponent {
  public readonly name: string
  public readonly parameters: { url: string; display_text: string }

  public constructor(url: string, displayText: string) {
    this.name = 'cta_url'
    this.parameters = { url, display_text: displayText }
  }

  public get _type() {
    return this.name
  }
}
