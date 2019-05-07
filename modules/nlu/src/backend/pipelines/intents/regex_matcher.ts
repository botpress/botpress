import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { Sequence } from '../../typings'

export default class RegexMatcher {
  constructor(private trainingSet: Sequence[], private readonly logger?: sdk.Logger) {}

  match(text: string, includedContext: string[]): sdk.NLU.Intent | void {
    const filteredDataset = this.trainingSet.filter(
      seq =>
        seq.cannonical.startsWith('<re>') &&
        seq.cannonical.includes('</re>') &&
        (!includedContext.length || _.intersection(seq.contexts || [], includedContext).length)
    )

    const lowText = text.toLowerCase()
    const seq = _.find(filteredDataset, s => {
      try {
        if (lowText.search(s.cannonical.slice(4, s.cannonical.search('</re>'))) != -1) {
          return true
        }
      } catch (e) {
        this.logger.error(`Error matching regular expression '${s.cannonical}': ${e.message}`)
      }
      return false
    })
    if (seq) {
      return {
        name: seq.intent,
        confidence: 1,
        context: seq.contexts[0] // todo fix this
      }
    }
  }
}
