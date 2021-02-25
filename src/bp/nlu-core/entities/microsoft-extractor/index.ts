import { NLU } from 'botpress/sdk'
import _ from 'lodash'

import { EntityExtractionResult, SystemEntityExtractor, KeyedItem } from '../../typings'
import { SystemEntityCacheManager } from '../entity-cache-manager'
import {
  SupportedLangs,
  SupportedLangsList,
  GlobalRecognizers,
  LanguageDependantRecognizers,
  DucklingUnitMapping,
  DucklingDateMappings,
  DucklingTypeMappings,
  langToCulture,
  MicrosoftValues,
  MicrosoftTimeValues,
  MicrosoftValue,
  MicrosoftEntity
} from './enums'
interface MicrosoftParams {
  lang: SupportedLangs
  recognizers: any[]
}

// Further improvements:
// 1- in _extractBatch, shift results ==> don't walk whole array n times (nlog(n) vs n2)

export class MicrosoftEntityExtractor implements SystemEntityExtractor {
  constructor(private _cache: SystemEntityCacheManager, private readonly logger?: NLU.Logger) {
    this.logger = logger
  }

  public async configure() {
    await this._cache.restoreCache()
  }

  public resetCache() {
    this._cache.reset()
  }

  public async extractMultiple(
    inputs: string[],
    lang: string,
    useCache?: boolean
  ): Promise<EntityExtractionResult[][]> {
    const options = !SupportedLangsList.includes(lang)
      ? { lang: 'en' as SupportedLangs, recognizers: [...GlobalRecognizers] }
      : { lang: lang as SupportedLangs, recognizers: [...LanguageDependantRecognizers, ...GlobalRecognizers] }

    const [cached, toFetch] = this._cache.splitCacheHitFromCacheMiss(inputs, !!useCache)

    const batchedRes = await this._extractBatch(toFetch, options)

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

  private formatEntity(entity: MicrosoftEntity): EntityExtractionResult {
    let unit: string
    let value: string

    if (entity.typeName.includes('datetimeV2')) {
      const resolution = entity.resolution as MicrosoftValues
      const metadatas = resolution.values[0] as MicrosoftTimeValues

      unit = metadatas.type
      entity.typeName = DucklingDateMappings[entity.typeName]

      switch (entity.typeName) {
        case 'duration':
          // TODO Uncomment this but do the same for the duckling extractor as well
          // let timeString = ''

          // if (metadatas.Mod) {
          //   timeString += metadatas.Mod + '###'
          // }

          // if (metadatas.start) {
          //   timeString += metadatas.start
          // }

          // if (metadatas.end) {
          //   timeString += '___' + metadatas.end
          // }

          // value = timeString
          value = metadatas.start || metadatas.end!
          break

        case 'time':
          value = metadatas.value!
          break

        default:
          value = ''
          break
      }
    } else {
      const metadatas = entity.resolution as MicrosoftValue
      unit = metadatas.unit || entity.typeName
      value = metadatas.value

      if (entity.typeName === 'dimension') {
        entity.typeName = this.getDucklingUnitMappings[metadatas.unit!]
      } else if (entity.typeName in DucklingTypeMappings) {
        entity.typeName = DucklingTypeMappings[entity.typeName]
      }
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

  private getDucklingUnitMappings = unit => {
    for (const [type, subtypes] of Object.entries(DucklingUnitMapping)) {
      if (subtypes.includes(unit)) {
        return type
      }
    }
  }

  private async _extractBatch(batch: KeyedItem[], params: MicrosoftParams): Promise<KeyedItem[]> {
    const culture = langToCulture(params.lang)

    if (_.isEmpty(batch) || !culture) {
      return []
    }

    const batchedEntities: EntityExtractionResult[][] = []
    for (const utt of batch) {
      let utteranceEntities: any[] = []

      for (const typeRecognizer of params.recognizers) {
        const entities: MicrosoftEntity[] = typeRecognizer(utt.input, culture)

        if (entities.length > 0) {
          const formatedEntities: EntityExtractionResult[] = entities.map(ent => this.formatEntity(ent))
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

  // Maybe useful in the date formatting to add features so keeping it here
  private _getTz(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  }
}
