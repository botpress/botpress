import { NLU } from 'botpress/sdk'
import _ from 'lodash'

import { SPACE } from '../../tools/token-utils'
import { BIO, Sequence, Tag, Token } from '../../typings'

export interface TagResult {
  tag: Tag | string
  name: string
  probability: number
}

const MIN_SLOT_CONFIDENCE = 0.15

// TODO replace sequence by utterance type once implemented
export function labelizeUtterance(utterance: Sequence): string[] {
  return utterance.tokens.map(labelizeToken)
}
// DEPRECATED
function labelizeToken(token: Token): string {
  if (!token.slot) {
    return token.tag
  }

  const any = _.isEmpty(token.matchedEntities) ? '/any' : ''
  return `${token.tag}-${token.slot}${any}`
}
// DEPRECATED
export function isTagAValidSlot(token: Token, result: TagResult, intentDef: NLU.IntentDefinition): boolean {
  if (!token || !result || result.tag === BIO.OUT || result.probability < MIN_SLOT_CONFIDENCE) {
    return false
  }

  return intentDef.slots.find(slotDef => slotDef.name === result.name) !== undefined
}
// DEPRECATED
// simply moved the code here
// not tested as this wil go away soon
export function makeSlot(
  tagRes: TagResult,
  token: Token,
  slotDef: NLU.SlotDefinition,
  entities: NLU.Entity[]
): NLU.Slot {
  const tokenSpaceOffset = token.value.startsWith(SPACE) ? 1 : 0
  const entity = entities.find(
    e =>
      slotDef.entities.indexOf(e.name) !== -1 &&
      e.meta.start <= token.start + tokenSpaceOffset &&
      e.meta.end >= token.end
  )

  if (!slotDef.entities.includes('any') && !entity) {
    return
  }

  const value = _.get(entity, 'data.value', token.canonical)
  const source = _.get(entity, 'meta.source', token.canonical)

  const slot = {
    name: tagRes.name,
    source,
    value,
    confidence: tagRes.probability
  } as NLU.Slot

  if (entity) {
    slot.entity = entity
  }

  return slot
}
// DEPRECATED
// combines the source and value of an existing and I type slot
export function combineSlots(existing: NLU.Slot, token: Token, tagRes: TagResult, newSlot: NLU.Slot): NLU.Slot {
  if (!existing) {
    return newSlot
  } else if (tagRes.tag === BIO.INSIDE && !existing.entity && !newSlot.entity) {
    // entity extraction fills source properly
    const maybeSpace = token.value.startsWith(SPACE) ? ' ' : ''
    const source = `${existing.source}${maybeSpace}${token.canonical}`
    // TODO: we might want to alter confidence with the newSlot prob as that's what a CRF technically does
    return {
      ...existing,
      source,
      value: source
    }
  } else if (tagRes.tag === BIO.BEGINNING) {
    // At the moment we keep the highest confidence only, we might want to return an array
    // I feel like it would make much more sens to enable this only when configured by the user
    // i.e user marks a slot as an array (configurable) and only then we make an array
    return _.maxBy([existing, newSlot], 'confidence')
  } else {
    return existing
  }
}
// DEPRECATED
export function predictionLabelToTagResult(prediction: { [label: string]: number }): TagResult {
  const [label, probability] = _.chain(prediction)
    .toPairs()
    .maxBy('1')
    .value()

  return {
    tag: label[0],
    name: label.slice(2).replace('/any', ''),
    probability
  } as TagResult
}
