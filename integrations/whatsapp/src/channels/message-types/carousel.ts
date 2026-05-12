import { chunkArray } from '../../misc/util'
import {
  buildCtaUrlPayload,
  buildQuickReplyPayload,
  formatCardBodyText,
  generateOutgoingMessages as renderSingleCard,
} from './card'
import { RawInteractiveMessage } from './raw-interactive'
import { channels } from '.botpress'
import * as bp from '.botpress'

export type Carousel = channels.channel.carousel.Carousel
type Card = channels.channel.card.Card
type CarouselItem = Carousel['items'][number]
type Action = Card['actions'][number]

// Per Meta's Interactive Media Carousel spec
const MIN_CARDS = 2
const MAX_CARDS = 10
const CARD_BODY_MAX_LENGTH = 160
const MAX_QR_BUTTONS_PER_CARD = 2

const ZERO_WIDTH_SPACE = '​'

type CarouselMessageProps = Parameters<
  NonNullable<bp.IntegrationProps['channels']['channel']['messages']>['carousel']
>[0]

export function* generateOutgoingMessages(props: CarouselMessageProps) {
  const { logger, message, payload } = props
  const result = _partitionForCarousel(payload.items)

  if (result.mode === 'fallback') {
    logger
      .forBot()
      .warn(
        `Message ${message.id}: falling back to per-card rendering instead of a native WhatsApp carousel: ${result.reason}`
      )
    for (const item of payload.items) {
      for (const m of _safeRenderCard(item, logger)) yield m
    }
    return
  }

  for (const partition of result.partitions) {
    yield _buildNativeCarousel(partition)
  }
}

function _safeRenderCard(item: CarouselItem, logger: bp.Logger) {
  try {
    return [...renderSingleCard(item, logger)]
  } catch (err) {
    const label = item.title?.trim() || '<untitled>'
    logger.forBot().error(`Skipped carousel card "${label}" because it failed to render:`, err)
    return []
  }
}

// ─── Partitioning ───────────────────────────────────────────────────

const _isUrlAction = (a: Action): boolean => a.action === 'url'
const _isQuickReplyAction = (a: Action): boolean => a.action === 'postback' || a.action === 'say'

// 'U' = url, 'Q' = quick-reply (postback / say); the array preserves action order
type CardShape = readonly ('U' | 'Q')[]

const _getCardShape = (card: Card): CardShape => card.actions.map((a) => (_isUrlAction(a) ? 'U' : 'Q'))

// A card slot must be exactly one URL or 1..MAX_QR_BUTTONS_PER_CARD quick-replies; no mixing, no empty.
const _isCarouselEligible = (shape: CardShape): boolean => {
  if (shape.length === 0) return false
  if (shape.length === 1 && shape[0] === 'U') return true
  return shape.length <= MAX_QR_BUTTONS_PER_CARD && shape.every((t) => t === 'Q')
}

const _hasDuplicateQuickReplyIds = (cards: Carousel['items']): boolean => {
  const ids = cards.flatMap((c) => c.actions.filter(_isQuickReplyAction).map((a) => a.value))
  return new Set(ids).size !== ids.length
}

type PartitionResult =
  | { mode: 'native'; partitions: ReadonlyArray<Carousel['items']> }
  | { mode: 'fallback'; reason: string }

// All-or-nothing: if any card can't slot in cleanly, the whole carousel
// falls back to per-card. Reasons are tester-facing (logged as warnings).
const _partitionForCarousel = (items: Carousel['items']): PartitionResult => {
  const shapes = items.map(_getCardShape)

  const noImageIdx = items.findIndex((item) => !item.imageUrl)
  if (noImageIdx !== -1) {
    return {
      mode: 'fallback',
      reason: `card #${noImageIdx} has no imageUrl (every carousel card needs an image header)`,
    }
  }

  const ineligibleIdx = shapes.findIndex((s) => !_isCarouselEligible(s))
  if (ineligibleIdx !== -1) {
    const shape = shapes[ineligibleIdx]!.join('') || 'no actions'
    return {
      mode: 'fallback',
      reason: `card #${ineligibleIdx} has shape "${shape}" which isn't carousel-eligible (must be 1 url, or 1-${MAX_QR_BUTTONS_PER_CARD} quick-replies, never mixed)`,
    }
  }
  const overlongIdx = items.findIndex((item) => {
    const body = formatCardBodyText(item)
    return body !== undefined && body.length > CARD_BODY_MAX_LENGTH
  })
  if (overlongIdx !== -1) {
    return {
      mode: 'fallback',
      reason: `card #${overlongIdx} body exceeds ${CARD_BODY_MAX_LENGTH} characters`,
    }
  }

  // Group consecutive cards with identical shapes
  type Run = { fingerprint: string; items: Carousel['items'] }
  const runs: Run[] = []
  for (let i = 0; i < items.length; i++) {
    const fingerprint = shapes[i]!.join('')
    const last = runs[runs.length - 1]
    if (last && last.fingerprint === fingerprint) {
      last.items.push(items[i]!)
    } else {
      runs.push({ fingerprint, items: [items[i]!] })
    }
  }

  const partitions: Carousel['items'][] = []
  for (const run of runs) {
    for (const chunk of chunkArray(run.items, MAX_CARDS)) {
      partitions.push(chunk)
    }
  }

  if (partitions.some((p) => p.length < MIN_CARDS)) {
    return {
      mode: 'fallback',
      reason: `partitioning would leave at least one single-card stranger between native carousels (rendering all ${items.length} cards individually instead)`,
    }
  }

  // Per-card fallback dodges this: ids only need to be unique within one bubble
  if (partitions.some(_hasDuplicateQuickReplyIds)) {
    return {
      mode: 'fallback',
      reason: 'duplicate quick-reply button ids across cards (Meta requires unique ids within a carousel message)',
    }
  }

  return { mode: 'native', partitions }
}

// ─── Native-carousel construction ───────────────────────────────────

const _buildCtaUrlSlot = (card: Card, idx: number) => ({
  card_index: idx,
  ...buildCtaUrlPayload({
    imageUrl: card.imageUrl!.trim(),
    bodyText: formatCardBodyText(card),
    displayText: card.actions.find(_isUrlAction)!.label,
    url: card.actions.find(_isUrlAction)!.value,
  }),
})

const _buildQuickReplySlot = (card: Card, idx: number) => ({
  card_index: idx,
  ...buildQuickReplyPayload({
    imageUrl: card.imageUrl!.trim(),
    bodyText: formatCardBodyText(card),
    buttons: card.actions.filter(_isQuickReplyAction).map((a) => ({ id: a.value, title: a.label })),
  }),
})

const _buildNativeCarousel = (items: Carousel['items']): RawInteractiveMessage => {
  const cards = items.map((item, idx) =>
    item.actions.some(_isUrlAction) ? _buildCtaUrlSlot(item, idx) : _buildQuickReplySlot(item, idx)
  )
  return new RawInteractiveMessage({
    type: 'carousel',
    body: { text: ZERO_WIDTH_SPACE }, // body is required; ZWSP keeps the strip bare
    action: { cards },
  })
}
