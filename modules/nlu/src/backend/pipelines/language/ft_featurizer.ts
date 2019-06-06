import _ from 'lodash'
import * as numjs from 'numjs'

import { LanguageProvider } from '../../language-provider'

const debug = DEBUG('nlu')
  .sub('intents')
  .sub('vocab')

type Token = string
type Document = Token[]

export default class FTWordVecFeaturizer {
  public static async getFeatures(
    lang: string,
    doc: Document,
    docTfidf: _.Dictionary<number>,
    langProvider: LanguageProvider
  ): Promise<number[]> {
    const defaultWordWeight = docTfidf['__avg__'] || 1
    const vecs = await langProvider.vectorize(doc, lang)

    debug(`get for '${lang}'`, { doc, gotten: vecs.map(x => x.length) })

    if (!vecs.length) {
      throw new Error(`Could not get sentence vectors (empty result)`)
    }

    // Compute sentence vector
    // See https://github.com/facebookresearch/fastText/blob/26bcbfc6b288396bd189691768b8c29086c0dab7/src/fasttext.cc#L486s
    const sentenceVec = numjs.zeros(vecs[0].length)
    let totalWeight = 0
    vecs.forEach((arr, i) => {
      let sum = 0
      arr.forEach(x => (sum += x * x))
      const norm = Math.sqrt(sum)
      if (norm > 0) {
        const weight = docTfidf[doc[i]] || defaultWordWeight
        totalWeight += weight
        const arr2 = numjs.array(arr).divide(norm / weight)
        sentenceVec.add(arr2, false)
      }
    })

    sentenceVec.divide(totalWeight, false)
    return sentenceVec.tolist() as number[]
  }
}
