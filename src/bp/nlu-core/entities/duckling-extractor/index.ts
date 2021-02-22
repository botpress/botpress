import Recognizers from '@microsoft/recognizers-text-suite'
import { NLU } from 'botpress/sdk'
import { ensureFile, pathExists, readJSON, writeJson } from 'fs-extra'
import _ from 'lodash'
import lru from 'lru-cache'
import ms from 'ms'
import sizeof from 'object-sizeof'
import path from 'path'

import { SPACE } from '../../tools/token-utils'
import { EntityExtractionResult, SystemEntityExtractor } from '../../typings'

import { DucklingParams } from './duckling-client'
import { DucklingDimension } from './typings'

interface KeyedItem {
  input: string
  idx: number
  entities?: EntityExtractionResult[]
}

export const JOIN_CHAR = `::${SPACE}::`
const BATCH_SIZE = 10

export const DUCKLING_ENTITIES: DucklingDimension[] = [
  'amountOfMoney',
  'distance',
  'duration',
  'email',
  'number',
  'ordinal',
  'phoneNumber',
  'quantity',
  'temperature',
  'time',
  'url',
  'volume'
]

const CACHE_PATH = path.join(process.APP_DATA_PATH || '', 'cache', 'sys_entities.json')

// Further improvements:
// 1- in _extractBatch, shift results ==> don't walk whole array n times (nlog(n) vs n2)

export class DucklingEntityExtractor implements SystemEntityExtractor {
  public static enabled: boolean

  private static _cache: lru<string, EntityExtractionResult[]>
  private _cacheDumpEnabled = true

  private _langToCulture = (lang: string): string => {
    switch (lang) {
      case 'zh': return Recognizers.Culture.Chinese
      case 'nl': return Recognizers.Culture.Dutch
      case 'en': return Recognizers.Culture.English
      case 'fr': return Recognizers.Culture.French
      case 'de': return Recognizers.Culture.German
      case 'it': return Recognizers.Culture.Italian
      case 'ja': return Recognizers.Culture.Japanese
      case 'pt': return Recognizers.Culture.Portuguese
      case 'es': return Recognizers.Culture.Spanish
      default: throw new Error('This language is not supported by Microsoft Recognizer')
    }
  }

  private _recognizers = [
    Recognizers.recognizeNumber,
    Recognizers.recognizeOrdinal,
    Recognizers.recognizePercentage,
    Recognizers.recognizeAge,
    Recognizers.recognizeCurrency,
    Recognizers.recognizeDimension,
    Recognizers.recognizeTemperature,
    Recognizers.recognizeDateTime,
    Recognizers.recognizeBoolean,
    Recognizers.recognizePhoneNumber,
    Recognizers.recognizeIpAddress,
    Recognizers.recognizeMention,
    Recognizers.recognizeHashtag,
    Recognizers.recognizeEmail,
    Recognizers.recognizeURL,
    Recognizers.recognizeGUID,
  ]

  constructor(private readonly logger?: NLU.Logger) {
    this.logger = logger
  }

  public static get entityTypes(): string[] {
    return DucklingEntityExtractor.enabled ? DUCKLING_ENTITIES : []
  }

  public static async configure(enabled: boolean, url: string, logger?: NLU.Logger) {
    if (enabled) {
      this.enabled = true

      this._cache = new lru<string, EntityExtractionResult[]>({
        length: (val: any, key: string) => sizeof(val) + sizeof(key),
        max:
          1000 * // n bytes per entity
          2 * // entities per utterance
          10 * // n utterances per intent
          100 * // n intents per bot
          50 // n bots
        // ~ 100 mb
      })

      await this._restoreCache()
    }
  }

  private static async _restoreCache() {
    try {
      if (await pathExists(CACHE_PATH)) {
        const dump = await readJSON(CACHE_PATH)
        if (dump) {
          this._cache.load(dump)
        }
      }
    } catch (err) {
      console.error('could not load duckling cache')
    }
  }

  public async extractMultiple(
    inputs: string[],
    lang: string,
    useCache?: boolean
  ): Promise<EntityExtractionResult[][]> {
    if (!DucklingEntityExtractor.enabled) {
      return Array(inputs.length).fill([])
    }

    const options = {
      lang,
      tz: this._getTz(),
      refTime: Date.now()
    }

    const [cached, toFetch] = inputs.reduce(
      ([cached, toFetch], input, idx) => {
        if (useCache && DucklingEntityExtractor._cache.has(input)) {
          const entities = DucklingEntityExtractor._cache.get(input)
          return [[...cached, { input, idx, entities }], toFetch]
        } else {
          return [cached, [...toFetch, { input, idx }]]
        }
      },
      [[], []] as [KeyedItem[], KeyedItem[]]
    )

    const chunks = _.chunk(toFetch, BATCH_SIZE)
    const batchedRes = await Promise.mapSeries(chunks, c => this._extractBatch(c, options))

    return _.chain(batchedRes)
      .flatten()
      .concat(cached)
      .orderBy('idx')
      .map(x => x.entities!)
      .value()
  }

  public async extract(input: string, lang: string, useCache?: boolean): Promise<EntityExtractionResult[]> {
    return (await this.extractMultiple([input], lang, useCache))[0]
  }

  private async _dumpCache() {
    try {
      await ensureFile(CACHE_PATH)
      await writeJson(CACHE_PATH, DucklingEntityExtractor._cache.dump())
    } catch (err) {
      this.logger?.error(`could not persist system entities cache, error ${err.message}`, err)
      this._cacheDumpEnabled = false
    }
  }

  private _onCacheChanged = _.debounce(async () => {
    if (this._cacheDumpEnabled) {
      await this._dumpCache()
    }
  }, ms('10s'))

  private async _extractBatch(batch: KeyedItem[], params: DucklingParams): Promise<KeyedItem[]> {
    if (_.isEmpty(batch)) {
      return []
    }

    const culture = this._langToCulture(params.lang)

    const batchedEntities: EntityExtractionResult[][] = []
    for (const utt of batch) {
      let utteranceEntities: any[] = []

      for (const typeRecognizer of this._recognizers) {
        const entities = typeRecognizer(utt.input, culture)

        if(entities.length>0){
          const formatedEntities: EntityExtractionResult[] = entities.map(ent=> {
            const formated: EntityExtractionResult = {
              confidence:1.0,
              type:ent.typeName,
              value:ent.resolution.value,
              start:ent.start,
              end:ent.end+1,
              metadata:{
                source:ent.text,
                entityId: `system.${ent.typeName}`,
                extractor:'system',
                unit:ent.resolution.unit
              }
            }
            return formated
          })

          utteranceEntities = utteranceEntities.concat(formatedEntities)
        }
      }

      batchedEntities.push(utteranceEntities)
    }

    await this._cacheBatchResults(batch.map(x=>x.input), batchedEntities)

    const allEntities = batch.map((batchItm, i) => {
      return { ...batchItm, entities: batchedEntities[i] }
    })

    return allEntities
  }

  private async _cacheBatchResults(inputs: string[], results: EntityExtractionResult[][]) {
    _.zipWith(inputs, results, (input, entities) => ({ input, entities })).forEach(({ input, entities }) => {
      DucklingEntityExtractor._cache.set(input, entities)
    })

    await this._onCacheChanged()
  }

  private _getTz(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  }
}
