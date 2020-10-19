import _ from 'lodash'

export const MAX_TFIDF = 2
export const MIN_TFIDF = 0.5
export const SMALL_TFIDF = (MAX_TFIDF - MIN_TFIDF) * 0.2 + MIN_TFIDF

const MIN_IDF = 0.25 // term appears in 78.5% of documents

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

    const tfidf: _.Dictionary<number> = _.mapValues(termsCount, (_v, term) => {
      const docFreq = _.values(docs).filter(x => x.includes(term)).length

      // Double-normalization TF with K=0.5
      // See https://en.wikipedia.org/wiki/Tf%E2%80%93idf
      // TODO: wikipedia recommends to divide by tf of mostly represented term in doc, not the meanTf
      const tf = 0.5 + (0.5 * termsCount[term]) / meanTf

      // Smooth IDF
      const idf = Math.max(MIN_IDF, Math.log(Object.keys(docs).length / docFreq))
      const tfidf = Math.max(MIN_TFIDF, Math.min(MAX_TFIDF, tf * idf))
      _avgSum[term] = (_avgSum[term] || 0) + tfidf
      _avgCount[term] = (_avgCount[term] || 0) + 1
      return tfidf
    })

    tfidf['__avg__'] = _.mean(_.values(tfidf))
    result[docName] = tfidf
  }

  result['__avg__'] = _.mapValues(_avgSum, (v, key) => v / _avgCount[key])

  return result
}
