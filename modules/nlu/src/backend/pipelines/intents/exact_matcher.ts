import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { KnownSlot, TrainingSequence } from '../../typings'
import { sanitize } from '../language/sanitizer'

type ExactMatchStructure = {
  sanitizedText: string
  includedContexts: string[]
  entities: sdk.NLU.Entity[]
}

// TODO if we're going to keep this, replace the training set with an inversed index or tree or at anything faster than O(n) at predict time
// this might be replaced by a knn with tweaked distance func & proper usage at predict time
export default class ExactMatcher {
  constructor(private trainingSet: TrainingSequence[]) {}

  exactMatch(ds: ExactMatchStructure): sdk.NLU.Intent | void {
    const { sanitizedText: text, includedContexts, entities: detectedEntities } = ds

    for (const seq of this.trainingSet) {
      if (includedContexts.length && !_.intersection(seq.contexts || [], includedContexts).length) {
        continue
      }

      let isMatch = this._matchWithoutReplacingSlots(text, seq.cannonical)

      const firstKnownSlot = _.first(seq.knownSlots)
      isMatch =
        isMatch ||
        (seq.knownSlots.length === 1 &&
          this._matchIgnoringSlot(text, seq.cannonical, firstKnownSlot!, detectedEntities))

      if (isMatch) {
        return {
          name: seq.intent,
          confidence: 1,
          context: seq.contexts![0] // todo fix this
        }
      }
    }
  }

  private _sanitizeText(text: string): string {
    return sanitize(text.toLowerCase())
  }

  private _matchWithoutReplacingSlots(textInput: string, textTraining: string): boolean {
    return this._sanitizeText(textTraining) === this._sanitizeText(textInput)
  }

  private _matchIgnoringSlot(
    textInput: string,
    textTraining: string,
    slot: KnownSlot,
    detectedEntities: sdk.NLU.Entity[]
  ): boolean {
    textInput = this._sanitizeText(textInput)
    const cannonical = this._sanitizeText(textTraining)

    const seqWithoutSlot = cannonical.substring(0, slot.start) + cannonical.substring(slot.end)

    const match = detectedEntities.find(e => {
      const textWithoutEntity = textInput.substring(0, e.meta.start) + textInput.substring(e.meta.end)
      return textWithoutEntity === seqWithoutSlot && slot.entities.includes(e.name)
    })
    return !!match
  }
}
