import retry from 'bluebird-retry'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import legacyElectionPipeline from '../legacy-election'
import { getLatestModel } from '../model-service'
import { setTrainingSession } from '../train-session-service'
import { NLUState } from '../typings'

async function initializeReportingTool(bp: typeof sdk, state: NLUState) {
  state.sendNLUStatusEvent = async (botId: string, trainSession: sdk.NLU.TrainingSession) => {
    await setTrainingSession(bp, botId, trainSession)

    const ev = { type: 'nlu', botId, trainSession: _.omit(trainSession, 'lock') }
    bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('statusbar.event', ev))
  }
}

function initializeLogger(bp: typeof sdk, state: NLUState) {
  const logger: sdk.NLU.Logger = {
    info: (msg: string) => bp.logger.info(msg),
    warning: (msg: string, err?: Error) => (err ? bp.logger.attachError(err).warn(msg) : bp.logger.warn(msg)),
    error: (msg: string, err?: Error) => (err ? bp.logger.attachError(err).error(msg) : bp.logger.error(msg))
  }
  state.logger = logger
}

const EVENTS_TO_IGNORE = ['session_reference', 'session_reset', 'bp_dialog_timeout', 'visit', 'say_something', '']

const ignoreEvent = (bp: typeof sdk, state: NLUState, event: sdk.IO.IncomingEvent) => {
  const health = bp.NLU.Engine.getHealth()
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

      let nluResults: sdk.IO.EventUnderstanding
      const { engine } = state.nluByBot[event.botId]
      const extractEngine2 = async () => {
        // eventually if model not loaded for bot languages ==> train or load
        nluResults = await engine.predict(event.preview, event.nlu.includedContexts)
        if (nluResults.errored && nluResults.suggestedLanguage) {
          const model = await getLatestModel(bp.ghost.forBot(event.botId), nluResults.suggestedLanguage)
          await engine.loadModel(model)
          // might throw again, thus usage of bluebird retry
          nluResults = await engine.predict(event.preview, event.nlu.includedContexts)
        }
      }

      try {
        await retry(extractEngine2, { max_tries: 2, throw_original: true })
        _.merge(event, { nlu: nluResults ?? {} })
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
    initializeLogger(bp, state)
    const globalConfig = await bp.config.getModuleConfig('nlu')
    await bp.NLU.Engine.initialize(globalConfig, state.logger)
    await registerMiddleware(bp, state)
  }
}
