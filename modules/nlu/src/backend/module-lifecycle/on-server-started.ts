import retry from 'bluebird-retry'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import semver from 'semver'

import nluInfo from '../../../package.json'
import Engine from '../engine'
import legacyElectionPipeline from '../legacy-election'
import { getLatestModel } from '../model-service'
import { InvalidLanguagePredictorError } from '../predict-pipeline'
import { removeTrainingSession, setTrainingSession } from '../train-session-service'
import { NLUProgressEvent, NLUState, NLUVersionInfo, TrainingSession } from '../typings'

async function initializeReportingTool(bp: typeof sdk, state: NLUState) {
  state.reportTrainingProgress = async (botId: string, message: string, trainSession: TrainingSession) => {
    await setTrainingSession(bp, botId, trainSession)

    const ev: NLUProgressEvent = {
      type: 'nlu',
      working: trainSession.status === 'training',
      botId,
      message,
      trainSession: _.omit(trainSession, 'lock')
    }
    bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('statusbar.event', ev))
    if (trainSession.status === 'done') {
      setTimeout(() => removeTrainingSession(bp, botId, trainSession), 5000)
    }
  }
}

const EVENTS_TO_IGNORE = ['session_reference', 'session_reset', 'bp_dialog_timeout', 'visit', 'say_something', '']

const ignoreEvent = (bp: typeof sdk, state: NLUState, event: sdk.IO.IncomingEvent) => {
  const health = Engine.tools.getHealth()
  return (
    !state.nluByBot[event.botId] ||
    !health.isEnabled ||
    !event.preview ||
    EVENTS_TO_IGNORE.includes(event.type) ||
    event.hasFlag(bp.IO.WellKnownFlags.SKIP_NATIVE_NLU)
  )
}

const registerMiddleware = async (bp: typeof sdk, state: NLUState) => {
  bp.events.registerMiddleware({
    name: 'nlu-predict.incoming',
    direction: 'incoming',
    order: 100,
    description:
      'Process natural language in the form of text. Structured data with an action and parameters for that action is injected in the incoming message event.',
    handler: async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
      if (ignoreEvent(bp, state, event)) {
        return next()
      }

      let nluResults = {}
      const { engine } = state.nluByBot[event.botId]
      const extractEngine2 = async () => {
        try {
          // eventually if model not loaded for bot languages ==> train or load
          nluResults = await engine.predict(event.preview, event.nlu.includedContexts)
        } catch (err) {
          if (err instanceof InvalidLanguagePredictorError) {
            const model = await getLatestModel(bp.ghost.forBot(event.botId), err.languageCode)
            await engine.loadModel(model)
            // might throw again, thus usage of bluebird retry
            nluResults = await engine.predict(event.preview, event.nlu.includedContexts)
          }
        }
      }

      try {
        await retry(extractEngine2, { max_tries: 2, throw_original: true })
        _.merge(event, { nlu: nluResults })
        removeSensitiveText(event)
      } catch (err) {
        bp.logger.warn(`Error extracting metadata for incoming text: ${err.message}`)
      } finally {
        next()
      }
    }
  })

  function removeSensitiveText(event: sdk.IO.IncomingEvent) {
    if (!event.nlu.entities || !event.payload.text) {
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

  bp.events.registerMiddleware({
    name: 'nlu-elect.incoming',
    direction: 'incoming',
    order: 120,
    description: 'Perform intent election for the outputed NLU.',
    handler: async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
      if (ignoreEvent(bp, state, event) || !event.nlu) {
        return next()
      }

      try {
        // TODO: use the 'intent-is' condition logic when bot uses NDU
        const nlu = legacyElectionPipeline(event.nlu)
        _.merge(event, { nlu })
      } catch (err) {
        bp.logger.warn(`Error making nlu election for incoming text: ${err.message}`)
      } finally {
        next()
      }
    }
  })
}

function setNluVersion(bp: typeof sdk, state: NLUState) {
  if (!semver.valid(nluInfo.version)) {
    bp.logger.error('nlu package.json file has an incorrect version format')
    return
  }

  state.nluVersion = semver.clean(nluInfo.version)
}

export function getOnSeverStarted(state: NLUState) {
  return async (bp: typeof sdk) => {
    setNluVersion(bp, state)
    await initializeReportingTool(bp, state)
    await Engine.initialize(bp, state)
    await registerMiddleware(bp, state)
  }
}
