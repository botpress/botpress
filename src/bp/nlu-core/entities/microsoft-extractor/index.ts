import Recognizers from '@microsoft/recognizers-text-suite'
import { NLU } from 'botpress/sdk'
import { ensureFile, pathExists, readJSON, writeJson } from 'fs-extra'
import _ from 'lodash'
import lru from 'lru-cache'
import ms from 'ms'
import sizeof from 'object-sizeof'
import path from 'path'

import { EntityExtractionResult, SystemEntityExtractor, KeyedItem } from '../../typings'
import { SystemEntityCacheManager } from '../entity-cache-manager'

type SupportedLangs = 'zh' | 'nl' | 'en' | 'fr' | 'de' | 'it' | 'ja' | 'pt' | 'es'
const SupportedLangsList = ['zh', 'nl', 'en', 'fr', 'de', 'it', 'ja', 'pt', 'es']

interface MicrosoftParams {
  lang: SupportedLangs
  recognizers: any[]
}

const BATCH_SIZE = 10000

// Further improvements:
// 1- in _extractBatch, shift results ==> don't walk whole array n times (nlog(n) vs n2)

export class MicrosoftEntityExtractor implements SystemEntityExtractor {
  private _cache: SystemEntityCacheManager

  constructor(private readonly logger?: NLU.Logger) {
    this.logger = logger
    this._cache = new SystemEntityCacheManager(
      path.join(process.APP_DATA_PATH || '', 'cache', 'microsoft_sys_entities.json'),
      true,
      logger
    )
  }

  private _langToCulture = (lang: SupportedLangs): string => {
    switch (lang) {
      case 'zh':
        return Recognizers.Culture.Chinese
      case 'nl':
        return Recognizers.Culture.Dutch
      case 'en':
        return Recognizers.Culture.English
      case 'fr':
        return Recognizers.Culture.French
      case 'de':
        return Recognizers.Culture.German
      case 'it':
        return Recognizers.Culture.Italian
      case 'ja':
        return Recognizers.Culture.Japanese
      case 'pt':
        return Recognizers.Culture.Portuguese
      case 'es':
        return Recognizers.Culture.Spanish
      default:
        throw new Error('This language is not supported by Microsoft Recognizer')
    }
  }

  private _globalRecognizers = [
    Recognizers.recognizePhoneNumber,
    Recognizers.recognizeIpAddress,
    Recognizers.recognizeMention,
    Recognizers.recognizeHashtag,
    Recognizers.recognizeEmail,
    Recognizers.recognizeURL,
    Recognizers.recognizeGUID
  ]

  private _languageDependantRecognizers = [
    Recognizers.recognizeNumber,
    Recognizers.recognizeOrdinal,
    Recognizers.recognizePercentage,
    Recognizers.recognizeAge,
    Recognizers.recognizeCurrency,
    Recognizers.recognizeDimension,
    Recognizers.recognizeTemperature,
    Recognizers.recognizeDateTime,
    Recognizers.recognizeBoolean
  ]

  public static get entityTypes(): string[] {
    return []
  }

  public async configure() {
    await this._cache.restoreCache()
  }

  public async extractMultiple(
    inputs: string[],
    lang: string,
    useCache?: boolean
  ): Promise<EntityExtractionResult[][]> {
    let options: MicrosoftParams

    if (!SupportedLangsList.includes(lang)) {
      lang = 'en'
      options = {
        lang: 'en' as SupportedLangs,
        recognizers: [this._globalRecognizers]
      }
    }

    options = {
      lang: lang as SupportedLangs,
      recognizers: [...this._languageDependantRecognizers, ...this._globalRecognizers]
    }

    const [cached, toFetch] = this._cache.getCachedAndToFetch(inputs)

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

  private formatEntity(entity) {
    let unit: string
    let value: string
    if (entity.resolution.values) {
      value = entity.resolution.values[0]
      unit = entity.resolution.values[0].type
    } else {
      unit = entity.resolution.unit
      value = entity.resolution.value
    }

    const formated: EntityExtractionResult = {
      confidence: 1.0,
      type: entity.typeName,
      value,
      start: entity.start,
      end: entity.end + 1,
      metadata: {
        source: entity.text,
        entityId: `system.${entity.typeName}`,
        extractor: 'system',
        unit
      }
    }
    return formated
  }

  private ducklingTypeMappings = {
    currency: 'amountOfMoney',
    email: 'email',
    number: 'number',
    ordinal: 'ordinal',
    phonenumber: 'phoneNumber',
    temperature: 'temperature',
    url: 'url'
  }

  private ducklingUnitMappings = {
    Mile: 'distance',
    Kilometer: 'distance',

    duration: 'duration',
    Milliliter: 'volume',
    Ounce: 'volume'
  }

  private ducklingDateMappings = {
    'datetimeV2.datetimerange': 'duration',
    'datetimeV2.timerange': 'duration',
    'datetimeV2.duration': 'duration',
    'datetimeV2.date': 'time',
    'datetimeV2.datetime': 'time'
  }

  private mapDucklingDates(entity): EntityExtractionResult {
    const i = 0
    entity.type = this.ducklingDateMappings[entity.type]

    switch (entity.type) {
      case 'duration':
        entity.value = {
          to: {
            value: entity.value.end,
            grain: 'hour'
          },
          from: {
            value: entity.value.start,
            grain: 'hour'
          }
        }
        break

      case 'time':
        entity.value = entity.value.value
        break

      default:
        this.logger?.error(`DIDN't GET ${entity}`)
    }

    return entity
  }
  private mapToDuckling(entity: EntityExtractionResult): EntityExtractionResult {
    if (entity.type in this.ducklingTypeMappings) {
      entity.type = this.ducklingTypeMappings[entity.type]
    } else if (entity.type === 'dimension') {
      entity.type = this.ducklingUnitMappings[entity.metadata.unit!]
    } else if (entity.type.includes('datetimeV2')) {
      entity = this.mapDucklingDates(entity)
    }
    return entity
  }

  private async _extractBatch(batch: KeyedItem[], params: MicrosoftParams): Promise<KeyedItem[]> {
    if (_.isEmpty(batch)) {
      return []
    }

    const culture = this._langToCulture(params.lang)

    const batchedEntities: EntityExtractionResult[][] = []
    for (const utt of batch) {
      let utteranceEntities: any[] = []

      for (const typeRecognizer of params.recognizers) {
        const entities = typeRecognizer(utt.input, culture)

        if (entities.length > 0) {
          const formatedEntities: EntityExtractionResult[] = entities.map(ent =>
            this.mapToDuckling(this.formatEntity(ent))
          )
          utteranceEntities = utteranceEntities.concat(formatedEntities)
        }
      }

      batchedEntities.push(utteranceEntities)
    }

    await this._cache.cacheBatchResults(
      batch.map(x => x.input),
      batchedEntities
    )

    return batch.map((batchItm, i) => ({ ...batchItm, entities: batchedEntities[i] }))
  }

  private _getTz(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  }
}
