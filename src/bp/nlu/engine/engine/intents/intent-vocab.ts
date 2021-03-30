import _ from 'lodash'
import { SPACE } from '../tools/token-utils'
import { Intent, ListEntityModel } from '../typings'
import Utterance from '../utterance/utterance'

interface IntentVocab {
  name: string
  vocab: string[]
  slot_entities: string[]
}

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

export const getEntitiesAndVocabOfIntent = (intent: Intent<Utterance>, entities: ListEntityModel[]): IntentVocab => {
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
    name: intent.name,
    vocab,
    slot_entities: allowedEntities
  }
}
