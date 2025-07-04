import { Text, Interactive, ActionButtons, Header, Image, Button, ActionCTA } from 'whatsapp-api-js/messages'
import { WHATSAPP } from '../../misc/constants'
import { convertMarkdownToWhatsApp } from '../../misc/markdown-to-whatsapp-rtf'
import { chunkArray, hasAtleastOne } from '../../misc/util'
import * as body from './interactive/body'
import * as button from './interactive/button'
import * as footer from './interactive/footer'
import { channels } from '.botpress'
import * as bp from '.botpress'

type Card = channels.channel.card.Card

type SDKAction = Card['actions'][number]
type ActionURL = SDKAction & { action: 'url' }
type ActionSay = SDKAction & { action: 'say' }
type ActionPostback = SDKAction & { action: 'postback' }

type Action = ActionSay | ActionURL | ActionPostback

type ActionsChunk = ReturnType<typeof chunkArray<ActionSay | ActionPostback>>[number]

export function* generateOutgoingMessages(card: Card, logger: bp.Logger) {
  const actions = card.actions

  if (actions.length === 0) {
    // No actions, so we can't display an interactive message
    for (const m of _generateHeader(card)) {
      yield m
    }
    return
  }

  // We have to split the actions into two groups (URL actions and other actions) because buttons are sent differently than URLs
  const urlActions = actions.filter(_isActionURL)
  const nonUrlActions = actions.filter(_isNotActionUrl)

  if (urlActions.length === 0) {
    // All actions are either postback or say
    for (const m of _generateButtonInteractiveMessages(card, nonUrlActions, logger)) {
      yield m
    }
    return
  }

  if (nonUrlActions.length === 0) {
    // All actions are URL
    if (card.imageUrl) {
      yield new Image(card.imageUrl)
    }

    for (const m of _generateCTAUrlInteractiveMessages(card, urlActions)) {
      yield m
    }

    return
  }

  // We have have a mix of URL, postback and say actions
  for (const m of _generateButtonInteractiveMessages(card, nonUrlActions, logger)) {
    yield m
  }

  for (const m of _generateCTAUrlInteractiveMessages(card, urlActions)) {
    yield m
  }
}

function* _generateHeader(card: Card) {
  if (card.imageUrl) {
    yield new Image(card.imageUrl, false, card.title)
  } else {
    yield new Text(convertMarkdownToWhatsApp(card.title))
  }

  if (card.subtitle) {
    yield new Text(convertMarkdownToWhatsApp(card.subtitle))
  }
}

function _isActionURL(action: Action): action is ActionURL {
  return action.action === 'url'
}

function _isNotActionUrl(action: Action): action is ActionSay | ActionPostback {
  return !_isActionURL(action)
}

function* _generateButtonInteractiveMessages(
  card: Card,
  actions: Array<ActionSay | ActionPostback>,
  logger: bp.Logger
) {
  const [firstChunk, ...followingChunks] = chunkArray(actions, WHATSAPP.INTERACTIVE_MAX_BUTTONS_COUNT)
  if (firstChunk) {
    const actionButtons = _createActionButtons(firstChunk)
    if (actionButtons) {
      yield new Interactive(
        actionButtons,
        body.create(card.title),
        card.imageUrl ? new Header(new Image(card.imageUrl, false)) : undefined,
        card.subtitle ? footer.create(card.subtitle) : undefined
      )
    } else {
      logger.debug('No buttons in chunk, skipping first chunk')
    }
  }

  if (followingChunks) {
    for (const chunk of followingChunks) {
      const actionsButtons = _createActionButtons(chunk)
      if (!actionsButtons) {
        logger.debug('No buttons in chunk, skipping')
        continue
      }
      yield new Interactive(actionsButtons, body.create(card.title))
    }
  }
}

function _createActionButtons(actionsChunk: ActionsChunk): ActionButtons | undefined {
  const buttons = _createButtons(actionsChunk)
  if (hasAtleastOne(buttons)) {
    return new ActionButtons(...buttons)
  }
  return undefined
}

function _createButtons(nonURLActions: Array<ActionSay | ActionPostback>) {
  const buttons: Button[] = []
  for (const action of nonURLActions) {
    buttons.push(button.create({ id: action.value, title: action.label }))
  }
  return buttons
}

function* _generateCTAUrlInteractiveMessages(card: Card, actions: ActionURL[]) {
  let actionNumber = 1

  for (const action of actions) {
    if (actionNumber === 1) {
      // First CTA URL button will be in a WhatsApp card
      yield new Interactive(
        new ActionCTA(action.label, action.value),
        body.create(card.subtitle ? convertMarkdownToWhatsApp(card.subtitle) : action.value),
        card.title ? new Header(card.title) : undefined
      )
    } else {
      // Subsequent CTA URL buttons will be standalone
      yield new Interactive(
        new ActionCTA(action.label, action.value),
        body.create('\u200B') // Zero width space character used to force the interactive message to be sent (WhatsApp documentation says body is optional but it's not actually true)
      )
    }

    actionNumber++
  }
}
