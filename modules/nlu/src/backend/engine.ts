import retry from 'bluebird-retry'
import * as sdk from 'botpress/sdk'
import crypto from 'crypto'
import fs from 'fs'
import { flatMap } from 'lodash'
import _ from 'lodash'

import { Config } from '../config'

import { DucklingEntityExtractor } from './pipelines/entities/duckling_extractor'
import { extractListEntities, extractPatternEntities } from './pipelines/entities/pattern_extractor'
import FastTextClassifier from './pipelines/intents/ft_classifier'
import { createIntentMatcher } from './pipelines/intents/matcher'
import { FastTextLanguageId } from './pipelines/language/ft_lid'
import CRFExtractor from './pipelines/slots/crf_extractor'
import { generateTrainingSequence } from './pipelines/slots/pre-processor'
import Storage from './storage'
import { EntityExtractor, LanguageIdentifier, Prediction, SlotExtractor } from './typings'

// this could be extracted in a constant map written in typings just like BIO
const INTENT_FN = 'intent'
const SKIPGRAM_FN = 'slot-skipgram'
const CRF_FN = 'slot-crf'

export default class ScopedEngine {
  public readonly storage: Storage
  public confidenceTreshold: number = 0.7

  private readonly intentClassifier: FastTextClassifier
  private readonly langDetector: LanguageIdentifier
  private readonly systemEntityExtractor: EntityExtractor
  private readonly slotExtractor: SlotExtractor

  private retryPolicy = {
    interval: 100,
    max_interval: 500,
    timeout: 5000,
    max_tries: 3
  }

  constructor(
    private logger: sdk.Logger,
    private botId: string,
    private readonly config: Config,
    private readonly toolkit: typeof sdk.MLToolkit
  ) {
    this.storage = new Storage(config, this.botId)
    this.intentClassifier = new FastTextClassifier(this.logger)
    this.langDetector = new FastTextLanguageId(this.logger)
    this.systemEntityExtractor = new DucklingEntityExtractor(this.logger)
    this.slotExtractor = new CRFExtractor(toolkit)
  }

  async init(): Promise<void> {
    this.confidenceTreshold = this.config.confidenceTreshold

    if (isNaN(this.confidenceTreshold) || this.confidenceTreshold < 0 || this.confidenceTreshold > 1) {
      this.confidenceTreshold = 0.7
    }

    if (await this.checkSyncNeeded()) {
      await this.sync()
    }
  }

  async sync(): Promise<void> {
    const intents = await this.storage.getIntents()
    const modelHash = this._getModelHash(intents)

    if (await this.storage.modelExists(modelHash)) {
      try {
        return this._loadModel(intents, modelHash)
      } catch (e) {
        this.logger.warn('Cannot load models from storage')
      }
    }

    this.logger.debug('Models need to be retrained')
    await this._trainModel(intents, modelHash)
  }

  async extract(incomingEvent: sdk.IO.Event): Promise<sdk.IO.EventUnderstanding> {
    return retry(() => this._extract(incomingEvent), this.retryPolicy)
  }

  async checkSyncNeeded(): Promise<boolean> {
    const intents = await this.storage.getIntents()

    if (intents.length) {
      const intentsHash = this._getModelHash(intents)
      return this.intentClassifier.currentModelId !== intentsHash
    }

    return false
  }

  private async _loadModel(intents: sdk.NLU.IntentDefinition[], modelHash: string) {
    // TODO you are at refectoring this so it works for intents & slot tagger
    this.logger.debug(`Restoring models '${modelHash}' from storage`)

    const models = await this.storage.getModelsFromHash(modelHash)
    const intentModel = models.find(model => model.meta.type === INTENT_FN)
    const skipgramModel = models.find(model => model.meta.type === SKIPGRAM_FN)
    const crfModel = models.find(model => model.meta.type === CRF_FN)

    if (!intentModel || !skipgramModel || !crfModel) {
      throw new Error('no such model')
    }

    this.intentClassifier.loadModel(intentModel.model, modelHash)

    const trainingSet = flatMap(intents, intent => {
      return intent.utterances.map(utterance => generateTrainingSequence(utterance, intent.slots, intent.name))
    })

    await this.slotExtractor.load(trainingSet, skipgramModel.model, crfModel.model)

    this.logger.debug(`Done restoring models from storage`)
  }

  // Persistence logic feels weird as we need to know the internals of the SlotTagger & IntentClassifier
  // TODO: either move this within classifier or in a "model service" layer between storage and classifiers
  private async _trainModel(intents: sdk.NLU.IntentDefinition[], modelHash: string) {
    const timestamp = Date.now()

    try {
      this.logger.debug('Training intent classifier')
      const intentModelPath = await this.intentClassifier.train(intents, modelHash)
      const intentModelBuffer = fs.readFileSync(intentModelPath)
      const intentModelName = `${timestamp}__${modelHash}__${INTENT_FN}.bin`
      // TODO pass model meta here instead of writing the fname
      await this.storage.persistModel(intentModelBuffer, intentModelName)
      this.logger.debug('Done training intent classifier')
    } catch (err) {
      return this.logger.attachError(err).error('Error training intents')
    }

    try {
      this.logger.debug('Training slot tagger')
      const trainingSet = flatMap(intents, intent => {
        return intent.utterances.map(utterance => generateTrainingSequence(utterance, intent.slots, intent.name))
      })
      const crfExtractorModel = await this.slotExtractor.train(trainingSet)
      const skipgramModelBuff = fs.readFileSync(crfExtractorModel.skipgramFN)
      const skipgramModelName = `${timestamp}__${modelHash}__${SKIPGRAM_FN}.bin`
      await this.storage.persistModel(skipgramModelBuff, skipgramModelName)
      const crfModelBuff = fs.readFileSync(crfExtractorModel.crfFN)
      const crfModelName = `${timestamp}__${modelHash}__${CRF_FN}.bin`
      await this.storage.persistModel(crfModelBuff, crfModelName)
      this.logger.debug('Done training slot tagger')
    } catch (err) {
      this.logger.attachError(err).error('Error training slot tagger')
    }

    // TODO perform models cleanup here !!
  }

  private _getModelHash(intents: sdk.NLU.IntentDefinition[]) {
    return crypto
      .createHash('md5')
      .update(JSON.stringify(intents))
      .digest('hex')
  }

  private async _extractEntities(text: string, lang: string): Promise<sdk.NLU.Entity[]> {
    const customEntityDefs = await this.storage.getCustomEntities()
    const patternEntities = extractPatternEntities(text, customEntityDefs.filter(ent => ent.type === 'pattern'))
    const listEntities = extractListEntities(text, customEntityDefs.filter(ent => ent.type === 'list'))
    const systemEntities = await this.systemEntityExtractor.extract(text, lang)

    return [...systemEntities, ...patternEntities, ...listEntities]
  }

  private async _extract(incomingEvent: sdk.IO.Event): Promise<sdk.IO.EventUnderstanding> {
    const ret: any = { errored: true }
    try {
      const text = incomingEvent.preview
      ret.language = await this.langDetector.identify(text)
      ret.intents = await this.intentClassifier.predict(text)
      const intent = findMostConfidentPredictionMeanStd(ret.intents, this.confidenceTreshold)
      ret.intent = { ...intent, matches: createIntentMatcher(intent.name) }
      ret.entities = await this._extractEntities(text, ret.language)

      const intentDef = await this.storage.getIntent(intent.name)
      ret.slots = await this.slotExtractor.extract(text, intentDef, ret.entities)
      ret.errored = false

    } catch (error) {
      this.logger.warn(`Could not extract whole NLU data, ${error}`)
    } finally {
      return ret as sdk.IO.EventUnderstanding
    }
  }
}

// We might want to move this in the intent pipeline
export const NonePrediction: Prediction = {
  confidence: 1.0,
  name: 'none'
}

/**
 * Finds the most confident intent, either by the intent being above a fixed threshold, or else if an intent is more than {@param std} standard deviation (outlier method).
 * We might want to move this in the intent pipeline as it is stricly related to it
 * @param intents
 * @param fixedThreshold
 * @param std number of standard deviation away. normally between 2 and 5
 */
export function findMostConfidentPredictionMeanStd(
  intents: Prediction[],
  fixedThreshold: number,
  std: number = 3
): Prediction {
  if (!intents.length) {
    return NonePrediction
  }

  const best = intents.find(x => x.confidence >= fixedThreshold)

  if (best) {
    return best
  }

  const mean = _.meanBy<Prediction>(intents, 'confidence')
  const stdErr =
    Math.sqrt(intents.reduce((a, c) => a + Math.pow(c.confidence - mean, 2), 0) / intents.length) /
    Math.sqrt(intents.length)

  const dominant = intents.find(x => x.confidence >= stdErr * std + mean)

  return dominant || NonePrediction
}
