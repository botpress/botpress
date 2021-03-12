import _ from 'lodash'
import { Logger } from '../../../typings'

import { EntityExtractionResult, SystemEntityExtractor, KeyedItem } from '../../typings'
import { SystemEntityCacheManager } from '../entity-cache-manager'
import {
  GlobalRecognizers,
  LanguageDependantRecognizers,
  DucklingUnitMapping,
  DucklingDateMappings,
  DucklingTypeMappings,
  langToCulture,
  isSupportedLanguage
} from './enums'

import {
  MicrosoftSupportedLanguage,
  MicrosoftValues,
  MicrosoftTimeValues,
  MicrosoftValue,
  MicrosoftEntity
} from './typings'
interface MicrosoftParams {
  lang: MicrosoftSupportedLanguage
  recognizers: any[]
}

export class MicrosoftEntityExtractor implements SystemEntityExtractor {
  constructor(private _cache: SystemEntityCacheManager, private readonly logger?: Logger) {
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
    const options: MicrosoftParams = !isSupportedLanguage(lang)
      ? { lang: 'en', recognizers: [...GlobalRecognizers] }
      : {
          lang,
          recognizers: [...LanguageDependantRecognizers, ...GlobalRecognizers]
        }

    const [cached, toFetch] = this._cache.splitCacheHitFromCacheMiss(inputs, !!useCache)

    const batchedRes = await this._extractBatch(toFetch, options)

    return _.chain(batchedRes)
      .flatten()
      .concat(cached)
      .orderBy(x => x.idx)
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
          // TODO Deal with intervals ! Also need to be fixed in duckling.
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
        entity.typeName = this.getDucklingUnitMappings(metadatas.unit!)
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

  private getDucklingUnitMappings = (unit: string): string => {
    for (const [type, subtypes] of Object.entries(DucklingUnitMapping)) {
      if (subtypes.includes(unit)) {
        return type
      }
    }
    return unit
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
}
