import * as sdk from 'botpress/sdk'
import _ from 'lodash'

// this will quickly be replaced by a knn
export default class ExactMatcher {
  constructor(private intentDefs: sdk.NLU.IntentDefinition[]) {}

  exactMatch(text: string, includedContext: string[]): sdk.NLU.Intent | void {
    const contextedIntents = this.intentDefs.filter(
      i => !includedContext.length || _.intersection(i.contexts, includedContext).length
    )

    const lowText = text.toLowerCase()
    for (const intent of contextedIntents) {
      if (_.findIndex(intent.utterances, u => u.toLowerCase() === lowText) !== -1) {
        return {
          name: intent.name,
          confidence: 1,
          context: intent.contexts[0] // todo fix this
        }
      }
    }
  }
}
