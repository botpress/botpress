import _ from 'lodash'

const MAX_TFIDF = 2
const MIN_TFIDF = 0.5

export type TfidfInput = _.Dictionary<string[]>
export type TfidfOutput = _.Dictionary<_.Dictionary<number>>

export default function tfidf(docs: TfidfInput): TfidfOutput {
  const result: TfidfOutput = {}

  const _avgSum: _.Dictionary<number> = {}
  const _avgCount: _.Dictionary<number> = {}

  for (const docName in docs) {
    const tokens = docs[docName]

    const termsCount = _.countBy(tokens, _.identity)
    const meanTf = _.mean(_.values(termsCount))!

    const tfidf: _.Dictionary<number> = _.mapValues(termsCount, (_v, key) => {
      const docFreq = _.values(docs).filter(x => x.includes(key)).length

      // Double-normalization TF with K=0.5
      // See https://en.wikipedia.org/wiki/Tf%E2%80%93idf
      const tf = 0.5 + (0.5 * termsCount[key]) / meanTf

      // Smooth IDF
      const idf = Math.max(0.25, -Math.log(docFreq / Object.keys(docs).length))
      const tfidf = Math.max(MIN_TFIDF, Math.min(MAX_TFIDF, tf * idf))
      _avgSum[key] = (_avgSum[key] || 0) + tfidf
      _avgCount[key] = (_avgCount[key] || 0) + 1
      return tfidf
    })

    tfidf['__avg__'] = _.mean(_.values(tfidf))
    result[docName] = tfidf
  }

  result['__avg__'] = _.mapValues(_avgSum, (v, key) => v / _avgCount[key])

  return result
}
