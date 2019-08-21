import * as sdk from 'botpress/sdk'

import { getKnownSlots } from './pipelines/slots/pre-processor'

import { IntentValidation, KnownSlot, EntityExtractor, NluMlRecommendations } from './typings'
import PatternExtractor from './pipelines/entities/pattern_extractor'

import Storage from './storage'
import _ from 'lodash'

const MIN_NB_UTTERANCES = 3
const GOOD_NB_UTTERANCES = 10

export class HintService {
  constructor(
    private botId: string,
    private storage: Storage,
    private entityExtractor: PatternExtractor,
    private systemEntityExtractor: EntityExtractor
  ) {}

  public getMLRecommendations(): NluMlRecommendations {
    return {
      minUtterancesForML: MIN_NB_UTTERANCES,
      goodUtterancesForML: GOOD_NB_UTTERANCES
    }
  }

  public async validateIntentSlots(intentName: string, lang: string): Promise<IntentValidation> {
    const intent = await this.storage.getIntent(intentName)
    if (!intent || !intent.utterances[lang]) {
      return
    }

    const allAvailableEntities = await this.storage.getAvailableEntities()

    const intentValidation = {} as IntentValidation

    for (const utt of intent.utterances[lang]) {
      intentValidation[utt] = {
        slots: []
      }
      const slots = getKnownSlots(utt, intent.slots)

      for (const slot of slots) {
        let isValidEntity = false

        for (const entity of slot.entities) {
          if (entity === 'any') {
            isValidEntity = true
            break
          }
          if (isValidEntity) {
            break
          }

          const entityDef = allAvailableEntities.find(x => x.name === entity)
          if (!entityDef) {
            continue
          }
          isValidEntity = await this._validateSlot(entityDef, slot, lang)
        }

        intentValidation[utt].slots.push({ ...slot, isValidEntity })
      }
    }

    return intentValidation
  }

  private async _validateSlot(entityDef: sdk.NLU.EntityDefinition, slot: KnownSlot, lang: string): Promise<boolean> {
    const { type } = entityDef
    const { source } = slot
    if (type === 'list') {
      return await this.entityExtractor.validateListEntityOccurence(entityDef, source)
    }
    if (type === 'pattern') {
      return await this.entityExtractor.validatePatternEntityOccurence(entityDef, source)
    }
    if (type === 'system') {
      return await this.systemEntityExtractor.validate(entityDef, source, lang)
    }
  }
}
