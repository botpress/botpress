import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { Sequence } from '../../typings'
import { sanitize } from '../language/sanitizer'

// TODO if we're going to keep this, replace the training set with an inversed index or tree or at anything faster than O(n) at predict time
// this might be replaced by a knn with tweaked distance func & proper usage at predict time
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
