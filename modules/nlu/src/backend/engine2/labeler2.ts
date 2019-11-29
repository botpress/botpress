import _ from 'lodash'

import { TagResult } from '../pipelines/slots/labeler'
import { BIO, Intent, SlotExtractionResult, Tag } from '../typings'

import Utterance from './utterance'

const MIN_SLOT_CONFIDENCE = 0.15

export function labelizeUtterance(utterance: Utterance): string[] {
  return utterance.tokens
    .filter(x => !x.isSpace)
    .map(token => {
      if (_.isEmpty(token.slots)) {
        return BIO.OUT
      }

      const slot = token.slots[0]
      const tag = slot.startTokenIdx === token.index ? BIO.BEGINNING : BIO.INSIDE
      const any = _.isEmpty(token.entities) ? '/any' : ''

      return `${tag}-${slot.name}${any}`
    })
}

export function predictionLabelToTagResult(prediction: { [label: string]: number }): TagResult {
  const [label, probability] = _.chain(prediction)
    .mapValues((value, key) => value + (prediction[key + '/any'] || 0))
    .toPairs()
    .maxBy('1')
    .value()

  return {
    tag: label[0],
    name: label.slice(2).replace('/any', ''),
    probability
  } as TagResult
}

export function removeInvalidTagsForIntent(intent: Intent<Utterance>, tag: TagResult): TagResult {
  if (tag.tag === BIO.OUT) {
    return tag
  }

  const foundInSlotDef = !!intent.slot_definitions.find(s => s.name === tag.name)

  if (tag.probability < MIN_SLOT_CONFIDENCE || !foundInSlotDef) {
    tag = {
      tag: BIO.OUT as Tag,
      name: '',
      probability: 1 - tag.probability // anything would do here
    }
  }

  return tag
}

export function makeExtractedSlots(
  intent: Intent<Utterance>,
  utterance: Utterance,
  slotTagResults: TagResult[]
): SlotExtractionResult[] {
  return _.zip(utterance.tokens.filter(t => !t.isSpace), slotTagResults)
    .filter(([token, tagRes]) => tagRes.tag !== BIO.OUT)
    .reduce((combined, [token, tagRes]) => {
      const last = _.last(combined)
      const shouldConcatWithPrev = tagRes.tag === BIO.INSIDE && _.get(last, 'slot.name') === tagRes.name

      if (shouldConcatWithPrev) {
        const newEnd = token.offset + token.value.length
        const newSource = utterance.toString({ entities: 'keep-default' }).slice(last.start, newEnd) // we use slice in case tokens are space split
        last.slot.source = newSource
        last.slot.value = newSource
        last.end = newEnd

        return [...combined.slice(0, -1), last]
      } else {
        return [
          ...combined,
          {
            slot: {
              name: tagRes.name,
              confidence: tagRes.probability,
              source: token.toString(),
              value: token.toString()
            },
            start: token.offset,
            end: token.offset + token.value.length
          }
        ]
      }
    }, [])
    .map((extracted: SlotExtractionResult) => {
      const entityInRange = utterance.entities.find(e => e.startPos >= extracted.start && e.endPos <= extracted.end)
      if (entityInRange && _.includes(intent.slot_entities, entityInRange.type)) {
        extracted.slot.value = entityInRange.value
      }
      return extracted
    })
}
