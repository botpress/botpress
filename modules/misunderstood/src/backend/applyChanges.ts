import Bluebird from 'bluebird'
import * as sdk from 'botpress/sdk'
import { QnaEntry } from 'common/typings'
import _ from 'lodash'
import memoize from 'lodash/memoize'
import uniq from 'lodash/uniq'

import { DbFlaggedEvent, FLAGGED_MESSAGE_STATUS, RESOLUTION_TYPE } from '../types'

export const addQnA = async (event: DbFlaggedEvent, botGhost: sdk.ScopedGhostService) => {
  const qnaId = event.resolution
  const qnaEntry: { data: QnaEntry } = await botGhost.readFileAsObject('qna', `${qnaId}.json`)
  qnaEntry.data.questions[event.language] = uniq([...(qnaEntry.data.questions[event.language] || []), event.preview])
  await botGhost.upsertFile('qna', `${qnaId}.json`, JSON.stringify(qnaEntry, null, 2))
}

const normalizeUtterance = memoize((utterance: string) => utterance.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'))

export const removeNLU = (language: string, utterance: string, botGhost: sdk.ScopedGhostService) => async (
  fileName: string
) => {
  const nluEntry: sdk.NLU.IntentDefinition = await botGhost.readFileAsObject('intents', fileName)
  if (nluEntry.utterances[language]) {
    nluEntry.utterances[language] = nluEntry.utterances[language].filter(
      u => normalizeUtterance(u) !== normalizeUtterance(utterance)
    )
  }
  await botGhost.upsertFile('intents', fileName, JSON.stringify(nluEntry, null, 2))
}

export const addNLU = async (event: DbFlaggedEvent, botGhost: sdk.ScopedGhostService) => {
  const intentName = event.resolution

  const nluFiles = (await botGhost.directoryListing('intents', '*.json', '__qna__*')).filter(
    fileName => fileName !== `${intentName}.json`
  )
  await Bluebird.mapSeries(nluFiles, removeNLU(event.language, event.preview, botGhost))

  const nluEntry: sdk.NLU.IntentDefinition = await botGhost.readFileAsObject('intents', `${intentName}.json`)
  nluEntry.utterances[event.language] = uniq([...(nluEntry.utterances[event.language] || []), event.preview])

  const params =
    event.resolutionParams && typeof event.resolutionParams !== 'object' ? JSON.parse(event.resolutionParams) : {}
  if (params.contexts) {
    nluEntry.contexts = uniq([...(nluEntry.contexts || []), ...params.contexts])
  }

  await botGhost.upsertFile('intents', `${intentName}.json`, JSON.stringify(nluEntry, null, 2))
}

export const applyChanges = (bp: typeof sdk, botId: string, tableName: string) => {
  const knex = bp.database

  return knex.transaction(async trx => {
    const events: DbFlaggedEvent[] = await trx(tableName)
      .select('id', 'language', 'preview', 'resolutionType', 'resolution', 'resolutionParams')
      .where({ botId, status: FLAGGED_MESSAGE_STATUS.pending })

    const qnaEvents = events.filter(({ resolutionType }) => resolutionType === RESOLUTION_TYPE.qna)
    const nluEvents = events.filter(({ resolutionType }) => resolutionType === RESOLUTION_TYPE.intent)

    const botGhost = bp.ghost.forBot(botId)

    await Bluebird.mapSeries(qnaEvents, async ev => addQnA(ev, botGhost))
    await Bluebird.mapSeries(nluEvents, async ev => addNLU(ev, botGhost))

    await trx(tableName)
      .update({
        status: FLAGGED_MESSAGE_STATUS.applied,
        updatedAt: knex.fn.now()
      })
      .whereIn(
        'id',
        events.map(({ id }) => id)
      )

    return _(events)
      .map(e => e.language)
      .uniq()
      .value()
  })
}
