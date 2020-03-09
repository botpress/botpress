import retry from 'bluebird-retry'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { Config } from '../../config'
import Engine from '../engine'
import { DucklingEntityExtractor } from '../entities/duckling_extractor'
import LangProvider from '../language/language-provider'
import { getPOSTagger, tagSentence } from '../language/pos-tagger'
import { getLatestModel } from '../model-service'
import { InvalidLanguagePredictorError } from '../predict-pipeline'
import { removeTrainingSession, setTrainingSession } from '../train-session-service'
import { NLUState, Token2Vec, Tools, TrainingSession } from '../typings'

export const initializeLanguageProvider = async (bp: typeof sdk, state: NLUState) => {
  const globalConfig = (await bp.config.getModuleConfig('nlu')) as Config

  try {
    const languageProvider = await LangProvider.initialize(globalConfig.languageSources, bp.logger)
    const { validProvidersCount, validLanguages } = languageProvider.getHealth()
    const health = {
      isEnabled: validProvidersCount > 0 && validLanguages.length > 0,
      validProvidersCount,
      validLanguages
    }

    state.languageProvider = languageProvider
    state.health = health
  } catch (e) {
    if (e.failure && e.failure.code === 'ECONNREFUSED') {
      bp.logger.error(`Language server can't be reached at address ${e.failure.address}:${e.failure.port}`)
      if (!process.IS_FAILSAFE) {
        process.exit()
      }
    }
    throw e
  }
}

function initializeEngine(bp: typeof sdk, state: NLUState) {
  const tools: Tools = {
    partOfSpeechUtterances: (tokenUtterances: string[][], lang: string) => {
      const tagger = getPOSTagger(lang, bp.MLToolkit)
      return tokenUtterances.map(tagSentence.bind(this, tagger))
    },
    tokenize_utterances: (utterances: string[], lang: string, vocab?: Token2Vec) =>
      state.languageProvider.tokenize(utterances, lang, vocab),
    vectorize_tokens: async (tokens, lang) => {
      const a = await state.languageProvider.vectorize(tokens, lang)
      return a.map(x => Array.from(x.values()))
    },
    generateSimilarJunkWords: (vocab: string[], lang: string) =>
      state.languageProvider.generateSimilarJunkWords(vocab, lang),
    mlToolkit: bp.MLToolkit,
    duckling: new DucklingEntityExtractor(bp.logger),
    reportTrainingProgress: async (botId: string, message: string, trainSession: TrainingSession) => {
      await setTrainingSession(bp, botId, trainSession)

      const ev = {
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
  Engine.provideTools(tools)
}

async function initDucklingExtractor(bp: typeof sdk): Promise<void> {
  const globalConfig = (await bp.config.getModuleConfig('nlu')) as Config
  await DucklingEntityExtractor.configure(globalConfig.ducklingEnabled, globalConfig.ducklingURL, bp.logger)
}

const EVENTS_TO_IGNORE = ['session_reference', 'session_reset', 'bp_dialog_timeout', 'visit', 'say_something', '']

const registerMiddleware = async (bp: typeof sdk, state: NLUState) => {
  bp.events.registerMiddleware({
    name: 'nlu.incoming',
    direction: 'incoming',
    order: 10,
    description:
      'Process natural language in the form of text. Structured data with an action and parameters for that action is injected in the incoming message event.',
    handler: async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
      if (
        !state.nluByBot[event.botId] ||
        !state.health.isEnabled ||
        !event.preview ||
        EVENTS_TO_IGNORE.includes(event.type) ||
        event.hasFlag(bp.IO.WellKnownFlags.SKIP_NATIVE_NLU)
      ) {
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
        bp.logger.warn('Error extracting metadata for incoming text: ' + err.message)
      } finally {
        next()
      }
    }
  })

  function removeSensitiveText(event) {
    if (!event.nlu.entities || !event.payload.text) {
      return
    }

    try {
      const sensitiveEntities = event.nlu.entities.filter(ent => ent.sensitive)
      for (const entity of sensitiveEntities) {
        const stars = '*'.repeat(entity.data.value.length)
        event.payload.text = event.payload.text.replace(entity.data.value, stars)
      }
    } catch (err) {
      bp.logger.warn('Error removing sensitive information: ' + err.message)
    }
  }
}

export function getOnSeverStarted(state: NLUState) {
  return async (bp: typeof sdk) => {
    await initDucklingExtractor(bp)
    await initializeLanguageProvider(bp, state)
    initializeEngine(bp, state)
    await registerMiddleware(bp, state)
  }
}
