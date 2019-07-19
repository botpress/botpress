import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { TrainingSequence, Sequence } from '../../typings'
import { sanitize } from '../language/sanitizer'

// TODO if we're going to keep this, replace the training set with an inversed index or tree or at anything faster than O(n) at predict time
// this might be replaced by a knn with tweaked distance func & proper usage at predict time
export default class ExactMatcher {
  constructor(private trainingSet: TrainingSequence[]) {}

  exactMatch(text: string, includedContext: string[]): sdk.NLU.Intent | void {
    return this._exactMatchFromSequence(text, includedContext, this.trainingSet)
  }

  exactMatchIgnoringEntity(text: string, includedContext: string[], entity: sdk.NLU.Entity) {
    const replacedText = this._replaceText(text, entity.name, entity.meta.start, entity.meta.end)
    const replacedCorpus = this._replaceCorpus(this.trainingSet, entity)

    return this._exactMatchFromSequence(replacedText, includedContext, replacedCorpus)
  }

  private _replaceText = (text: string, by: string, start: number, end: number) =>
    text.substring(0, start) + by + text.substring(end)

  private _replaceCorpus(corpus: TrainingSequence[], entity: sdk.NLU.Entity): Partial<Sequence>[] {
    const sequences = { ...corpus }

    const newCorpus = [] as Partial<Sequence>[]
    for (const seq of sequences) {
      const knownSlots = seq.knownSlots

      let cannonical = seq.cannonical
      for (const ks of knownSlots) {
        if (ks.entities.includes(entity.name)) {
          cannonical = this._replaceText(cannonical, entity.name, ks.start, ks.end)
        }
      }
      newCorpus.push({
        cannonical,
        contexts: seq.contexts,
        intent: seq.intent
      })
    }

    return newCorpus
  }

  private _exactMatchFromSequence(
    text: string,
    includedContext: string[],
    sequences: Partial<Sequence>[]
  ): sdk.NLU.Intent | void {
    const lowText = sanitize(text.toLowerCase())

    const seq = sequences
      .filter(seq => !includedContext.length || _.intersection(seq.contexts || [], includedContext).length)
      .find(s => sanitize(s.cannonical.toLowerCase()) === lowText)

    if (seq) {
      return {
        name: seq.intent,
        confidence: 1,
        context: seq.contexts[0] // todo fix this
      }
    }
  }
}
