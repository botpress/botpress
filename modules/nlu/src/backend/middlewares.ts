import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import yn from 'yn'

import { Config } from '../config'
import { NLUApplication } from './application'
import { election } from './election'
import pickSpellChecked from './election/spellcheck-handler'

const EVENTS_TO_IGNORE = ['session_reference', 'session_reset', 'bp_dialog_timeout', 'visit', 'say_something', '']

const PREDICT_MW = 'nlu-predict.incoming'

const _ignoreEvent = async (bp: typeof sdk, app: NLUApplication, event: sdk.IO.IncomingEvent) => {
  const health = await app.getHealth()
  return (
    !app.hasBot(event.botId) ||
    !health?.isEnabled ||
    !event.preview ||
    EVENTS_TO_IGNORE.includes(event.type) ||
    event.hasFlag(bp.IO.WellKnownFlags.SKIP_NATIVE_NLU)
  )
}

const removeSensitiveText = (bp: typeof sdk, event: sdk.IO.IncomingEvent) => {
  if (!event.nlu || !event.nlu.entities || !event.payload.text) {
    return
  }

  try {
    const sensitiveEntities = event.nlu.entities.filter(ent => ent.meta.sensitive)
    for (const entity of sensitiveEntities) {
      const stars = '*'.repeat(entity.data.value.length)
      event.payload.text = event.payload.text.replace(entity.data.value, stars)
    }
  } catch (err) {
    bp.logger.warn(`Error removing sensitive information: ${err.message}`)
  }
}

export const registerMiddlewares = async (bp: typeof sdk, app: NLUApplication) => {
  const globalConfig: Config = await bp.config.getModuleConfig('nlu')

  bp.events.registerMiddleware({
    name: PREDICT_MW,
    direction: 'incoming',
    order: 100,
    timeout: '6s',
    description:
      'Process natural language in the form of text. Structured data with an action and parameters for that action is injected in the incoming message event.',
    handler: async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
      if (await _ignoreEvent(bp, app, event)) {
        return next(undefined, false, true)
      }

      try {
        const { botId, preview } = event
        const anticipatedLanguage: string | undefined = event.state.user?.language

        const bot = app.getBot(botId)

        const t0 = Date.now()

        const predOutput = await bot.predict(preview, anticipatedLanguage)
        const includedContexts = event.nlu?.includedContexts ?? []

        const appendTime = <T>(eu: T) => ({ ...eu, ms: Date.now() - t0 })

        let nluResults = { ...predOutput, includedContexts }
        if (nluResults.spellChecked && nluResults.spellChecked !== preview && !yn(process.env.NLU_SKIP_SPELLCHECK)) {
          const predOutput = await bot.predict(nluResults.spellChecked, anticipatedLanguage)
          const spellCheckedResults = { ...predOutput, includedContexts }
          nluResults = pickSpellChecked(appendTime(nluResults), appendTime(spellCheckedResults))
        }

        const postElection = election(appendTime(nluResults), globalConfig)
        _.merge(event, { nlu: postElection })
        removeSensitiveText(bp, event)
      } catch (err) {
        bp.logger.warn(`Error extracting metadata for incoming text: ${err.message}`)
      } finally {
        next()
      }
    }
  })
}

export const removeMiddlewares = async (bp: typeof sdk) => {
  bp.events.removeMiddleware(PREDICT_MW)
}
