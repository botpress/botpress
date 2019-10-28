import _ from 'lodash'

import { Intent, Utterance } from './engine2'
import { BIO, Tag } from '../typings'

import { TagResult } from '../pipelines/slots/labeler'

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

export function swapInvalidTags(tag: TagResult, intent: Intent<Utterance>): TagResult {
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
