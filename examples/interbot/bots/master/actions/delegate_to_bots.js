const axios = require('axios')
const _ = require('lodash')

/**
 * Tries to delegate the question to one of the specified sub-bots
 *
 * The state will be amended as follow..
 *
 * **No delegation found**
 * `temp.delegation` => `[]`
 *
 * **Delegation(s) found**
 * `temp.delegation` => `[ { botId: '', confidence: 0.5, botUrl: '', answer: '' } ]`
 * > Results will be sorted by confidence ranking
 *
 * @title Get Delegation
 * @category Delegation
 * @param {string} [bots=sub1,sub2] The botId of the bots to ask (case-sensitive). Split with a comma.
 * @param {Number} [minConfidence=0.5] The minimum NLU confidence of the sub-bot to be considered a match
 */

const exec = async (bots = '', minConfidence = '0.5') => {
  const random = Math.random()
    .toString()
    .substr(3, 8)
  const uniqueUserId = `delegate_${event.target}_${random}`

  minConfidence = Number(minConfidence)
  minConfidence = isNaN(minConfidence) ? 0.5 : minConfidence

  const botIds = bots
    .split(',')
    .map(x => x.trim())
    .filter(x => x.length)

  const matches = []

  for (let botId of botIds) {
    const axiosConfig = await bp.http.getAxiosConfigForBot(botId, { localUrl: true })
    const { data } = await axios
      .post(
        `/converse/${uniqueUserId}/secured`,
        {
          type: 'text',
          text: event.preview,
          includedContexts: ['global']
        },
        { ...axiosConfig, params: { include: 'decision' } }
      )
      .catch(() => ({ data: {} /* We don't want the error to crash the master bot */ }))
    const confidence = _.get(data, 'decision.confidence', 0)
    if (confidence >= minConfidence) {
      matches.push({
        confidence,
        botId,
        botUrl: `${process.EXTERNAL_URL}/s/${botId}`,
        answer: _.get((data.responses || []).find(x => !!x.text), 'text')
      })
    }
  }

  temp.delegation = _.orderBy(matches, 'confidence', 'desc')
}

return exec(args.bots, args.minConfidence)
