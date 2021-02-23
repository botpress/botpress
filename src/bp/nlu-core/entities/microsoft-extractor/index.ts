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
    Recognizers.recognizeGUID
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
    if (!SupportedLangsList.includes(lang)) {
      return []
    }

    const options = { lang: lang as SupportedLangs }

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

  private async _extractBatch(batch: KeyedItem[], params: MicrosoftParams): Promise<KeyedItem[]> {
    if (_.isEmpty(batch)) {
      return []
    }

    const culture = this._langToCulture(params.lang)

    const batchedEntities: EntityExtractionResult[][] = []
    for (const utt of batch) {
      let utteranceEntities: any[] = []

      for (const typeRecognizer of this._recognizers) {
        const entities = typeRecognizer(utt.input, culture)

        if (entities.length > 0) {
          const formatedEntities: EntityExtractionResult[] = entities.map(ent => {
            const formated: EntityExtractionResult = {
              confidence: 1.0,
              type: ent.typeName,
              value: ent.resolution.value,
              start: ent.start,
              end: ent.end + 1,
              metadata: {
                source: ent.text,
                entityId: `system.${ent.typeName}`,
                extractor: 'system',
                unit: ent.resolution.unit
              }
            }
            return formated
          })

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
