import { Text, Interactive, ActionButtons, ActionCTA, Header, Image, Body, Button } from 'whatsapp-api-js/messages'
import { WHATSAPP } from '../../misc/constants'
import { convertMarkdownToWhatsApp } from '../../misc/markdown-to-whatsapp-rtf'
import { chunkArray, hasAtleastOne } from '../../misc/util'
import * as button from './interactive/button'
import { RawInteractiveMessage } from './raw-interactive'
import { channels } from '.botpress'
import * as bp from '.botpress'

// Standalone Interactive body cap (CTA URL & Reply Buttons share it)
const BODY_MAX_LENGTH = 1024
const BUTTON_ID_MAX_LENGTH = 256

const ZERO_WIDTH_SPACE = '​'

type Card = channels.channel.card.Card

export const formatCardBodyText = (card: Card): string | undefined => {
  const title = card.title?.trim()
  const subtitle = card.subtitle?.trim()
  if (!title && !subtitle) return undefined
  const formatted = title && subtitle ? `**${title}**\n\n${subtitle}` : title ? `**${title}**` : subtitle!
  return convertMarkdownToWhatsApp(formatted)
}

const _truncatedBody = (text: string) => new Body(text.substring(0, BODY_MAX_LENGTH))

type SDKAction = Card['actions'][number]
type ActionURL = SDKAction & { action: 'url' }
type ActionSay = SDKAction & { action: 'say' }
type ActionPostback = SDKAction & { action: 'postback' }

type Action = ActionSay | ActionURL | ActionPostback

type ActionsChunk = ReturnType<typeof chunkArray<ActionSay | ActionPostback>>[number]

export function* generateOutgoingMessages(card: Card, logger: bp.Logger) {
  const actions = card.actions

  if (actions.length === 0) {
    for (const m of _renderActionlessCard(card)) {
      yield m
    }
    return
  }

  let isFirstMessage = true
  for (const run of _partitionActionsByKind(actions)) {
    const opts = { attachContextToFirst: isFirstMessage }
    const messages =
      run.kind === 'url'
        ? _generateCTAUrlInteractiveMessages(card, run.actions, logger, opts)
        : _generateButtonInteractiveMessages(card, run.actions, logger, opts)
    for (const message of messages) {
      yield message
    }
    isFirstMessage = false
  }
}

type ActionRun = { kind: 'url'; actions: ActionURL[] } | { kind: 'button'; actions: Array<ActionSay | ActionPostback> }

// WA doesn't allow mixing url (CTA) and postbacks (Reply), so we group sequential
function _partitionActionsByKind(actions: Action[]): ActionRun[] {
  const runs: ActionRun[] = []
  for (const a of actions) {
    if (a.action === 'url') {
      const last = runs[runs.length - 1]
      if (last && last.kind === 'url') last.actions.push(a)
      else runs.push({ kind: 'url', actions: [a] })
    } else {
      const last = runs[runs.length - 1]
      if (last && last.kind === 'button') last.actions.push(a)
      else runs.push({ kind: 'button', actions: [a] })
    }
  }
  return runs
}

// No actions → no interactive bubble; emit the card's image+text as plain
// messages so the content still reaches the user.
function* _renderActionlessCard(card: Card) {
  if (card.imageUrl) {
    yield new Image(card.imageUrl, false, card.title)
  } else {
    yield new Text(convertMarkdownToWhatsApp(card.title))
  }

  if (card.subtitle) {
    yield new Text(convertMarkdownToWhatsApp(card.subtitle))
  }
}

function* _generateButtonInteractiveMessages(
  card: Card,
  actions: Array<ActionSay | ActionPostback>,
  logger: bp.Logger,
  opts: { attachContextToFirst: boolean }
) {
  const [firstChunk, ...followingChunks] = chunkArray(actions, WHATSAPP.INTERACTIVE_MAX_BUTTONS_COUNT)
  if (firstChunk) {
    const actionButtons = _createActionButtons(firstChunk)
    if (actionButtons) {
      if (opts.attachContextToFirst) {
        yield new Interactive(
          actionButtons,
          _truncatedBody(formatCardBodyText(card) ?? ZERO_WIDTH_SPACE),
          card.imageUrl ? new Header(new Image(card.imageUrl, false)) : undefined
        )
      } else {
        // Earlier message in this card already carried the image/title/subtitle —
        // render this run as a button-only bubble so context doesn't repeat.
        yield new Interactive(actionButtons, _truncatedBody(ZERO_WIDTH_SPACE))
      }
    } else {
      logger.debug('No buttons in chunk, skipping first chunk')
    }
  }

  for (const chunk of followingChunks || []) {
    const actionsButtons = _createActionButtons(chunk)
    if (!actionsButtons) {
      logger.debug('No buttons in chunk, skipping')
      continue
    }
    yield new Interactive(actionsButtons, _truncatedBody(ZERO_WIDTH_SPACE))
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

function* _generateCTAUrlInteractiveMessages(
  card: Card,
  actions: ActionURL[],
  _logger: bp.Logger,
  opts: { attachContextToFirst: boolean }
) {
  let isFirst = true

  for (const action of actions) {
    const useFullContext = isFirst && opts.attachContextToFirst
    if (useFullContext && card.imageUrl) {
      yield buildCtaUrlMessage({
        imageUrl: card.imageUrl,
        bodyText: formatCardBodyText(card) ?? action.value,
        displayText: action.label,
        url: action.value,
      })
    } else if (useFullContext) {
      yield new Interactive(
        new ActionCTA(action.label, action.value),
        _truncatedBody(formatCardBodyText(card) ?? action.value)
      )
    } else {
      yield new Interactive(new ActionCTA(action.label, action.value), _truncatedBody(ZERO_WIDTH_SPACE))
    }

    isFirst = false
  }
}

export function buildCtaUrlPayload(opts: { imageUrl: string; bodyText?: string; displayText: string; url: string }) {
  return {
    type: 'cta_url' as const,
    header: { type: 'image' as const, image: { link: opts.imageUrl } },
    ...(opts.bodyText !== undefined ? { body: { text: opts.bodyText } } : {}),
    action: {
      name: 'cta_url' as const,
      parameters: {
        display_text: opts.displayText.substring(0, WHATSAPP.BUTTON_LABEL_MAX_LENGTH),
        url: opts.url,
      },
    },
  }
}

export function buildQuickReplyPayload(opts: {
  imageUrl: string
  bodyText?: string
  buttons: ReadonlyArray<{ id: string; title: string }>
}) {
  return {
    type: 'cta_url' as const,
    header: { type: 'image' as const, image: { link: opts.imageUrl } },
    ...(opts.bodyText !== undefined ? { body: { text: opts.bodyText } } : {}),
    action: {
      buttons: opts.buttons.map((b) => ({
        type: 'quick_reply' as const,
        quick_reply: {
          id: b.id.substring(0, BUTTON_ID_MAX_LENGTH),
          title: b.title.substring(0, WHATSAPP.BUTTON_LABEL_MAX_LENGTH),
        },
      })),
    },
  }
}

function buildCtaUrlMessage(opts: {
  imageUrl: string
  bodyText: string
  displayText: string
  url: string
}): RawInteractiveMessage {
  return new RawInteractiveMessage(
    buildCtaUrlPayload({
      imageUrl: opts.imageUrl,
      bodyText: opts.bodyText.substring(0, BODY_MAX_LENGTH),
      displayText: opts.displayText,
      url: opts.url,
    })
  )
}
