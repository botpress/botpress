import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { Sequence } from '../../typings'
import { sanitize } from '../language/sanitizer'

// this will quickly be replaced by a knn
// TODO if we're going to keep this, replace the training set with a tree or at least something that runs faster than N at predict time
// inversed index would be better
export default class ExactMatcher {
  constructor(private trainingSet: Sequence[]) {}

  exactMatch(text: string, includedContext: string[]): sdk.NLU.Intent | void {
    const filteredDataset = this.trainingSet.filter(
      seq => !includedContext.length || _.intersection(seq.contexts || [], includedContext).length
    )

    const lowText = sanitize(text.toLowerCase())
    const seq = _.find(filteredDataset, s => sanitize(s.cannonical.toLowerCase()) === lowText)
    if (seq) {
      return {
        name: seq.intent,
        confidence: 1,
        context: seq.contexts[0] // todo fix this
      }
    }
  }
}
