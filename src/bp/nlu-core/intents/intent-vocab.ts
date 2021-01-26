import _ from 'lodash'
import { IntentSlotFeatures } from 'nlu-core/slots/slot-tagger'
import { SPACE } from 'nlu-core/tools/token-utils'
import { Intent, ListEntityModel } from 'nlu-core/typings'
import Utterance from 'nlu-core/utterance/utterance'

type IntentWithSlotFeatures = Intent<Utterance> & IntentSlotFeatures

export const buildIntentVocab = (utterances: Utterance[], intentEntities: ListEntityModel[]): Dic<boolean> => {
  // @ts-ignore
  const entitiesTokens: string[] = _.chain(intentEntities)
    .flatMapDeep(e => Object.values(e.mappingsTokens))
    .map((t: string) => t.toLowerCase().replace(SPACE, ' '))
    .value()

  return _.chain(utterances)
    .flatMap(u => u.tokens.filter(t => _.isEmpty(t.slots)).map(t => t.toString({ lowerCase: true })))
    .concat(entitiesTokens)
    .reduce((vocab: Dic<boolean>, tok: string) => ({ ...vocab, [tok]: true }), {})
    .value()
}

export const getEntitiesAndVocabOfIntent = (
  intents: Intent<Utterance>[],
  entities: ListEntityModel[]
): IntentWithSlotFeatures[] => {
  return intents.map(intent => {
    const allowedEntities = _.chain(intent.slot_definitions)
      .flatMap(s => s.entities)
      .filter(e => e !== 'any')
      .uniq()
      .value() as string[]

    const entityModels = _.intersectionWith(entities, allowedEntities, (entity, name) => {
      return entity.entityName === name
    })

    const vocab = Object.keys(buildIntentVocab(intent.utterances, entityModels))
    return {
      ...intent,
      vocab,
      slot_entities: allowedEntities
    }
  })
}
