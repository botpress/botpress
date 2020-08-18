import * as sdk from 'botpress/sdk'
import { Migration } from 'core/services/migration'
import _ from 'lodash'

const INTENT_DIR = 'intents'
const ENTITIES_DIR = 'entities'
const ALL_SLOTS_REGEX = /\[(.+?)\]\(([\w_\. :-]+)\)/gi // taken from 'nlu-core/utterance/utterance-parser.ts'

type OldSlotDefinition = sdk.NLU.SlotDefinition & {
  entities: string[]
}

type OldIntent = Omit<sdk.NLU.IntentDefinition, 'slots'> & {
  slots: OldSlotDefinition[]
}

const migration: Migration = {
  info: {
    description: 'Migrate slots to new Albert variables',
    target: 'bot',
    type: 'content'
  },
  up: async ({ bp, metadata }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    try {
      if (metadata.botId) {
        await updateBot(bp, metadata.botId)
      } else {
        const bots = await bp.bots.getAllBots()
        for (const botId of Array.from(bots.keys())) {
          await updateBot(bp, botId)
        }
      }
      return { success: true, message: 'Slots updated successfully' }
    } catch (err) {
      return { success: false, message: `Slot migration could not finish due to error: ${err.message}` }
    }
  }
}
export default migration

async function updateBot(bp: typeof sdk, botId: string): Promise<void> {
  const scopedGhost = bp.ghost.forBot(botId!)
  const intentFiles = await scopedGhost.directoryListing(INTENT_DIR, '*.json')

  const allEntities = await getEntities(scopedGhost)
  const complexCreator = new ComplexEntityCreator(allEntities)

  const intentUpdater = migrateOneIntent(complexCreator)
  for (const intentFile of intentFiles) {
    const rawContent = await scopedGhost.readFileAsString(INTENT_DIR, intentFile)
    const intent: OldIntent = JSON.parse(rawContent)
    const updatedIntent = await intentUpdater(intent)

    const newContent = JSON.stringify(updatedIntent, undefined, 2)
    await scopedGhost.upsertFile(INTENT_DIR, intentFile, newContent)
  }

  for (const newComplex of complexCreator.getNewComplexs()) {
    const rawContent = JSON.stringify(newComplex, undefined, 2)
    const fName = `${newComplex.name}.json`
    await scopedGhost.upsertFile(ENTITIES_DIR, fName, rawContent)
  }
}

async function getEntities(scopedGhost: sdk.ScopedGhostService): Promise<sdk.NLU.EntityDefinition[]> {
  const entitiesFiles = await scopedGhost.directoryListing(ENTITIES_DIR, '*.json')
  return Promise.map(entitiesFiles, async fname => {
    const rawContent = await scopedGhost.readFileAsString(ENTITIES_DIR, fname)
    return JSON.parse(rawContent)
  })
}

class ComplexEntityCreator {
  private newComplexs: _.Dictionary<sdk.NLU.EntityDefinition> = {}

  constructor(private entities: sdk.NLU.EntityDefinition[]) {}

  buildNewComplexFromSlotAny(name: string) {
    if (!!this.newComplexs[name]) {
      return name // here there is collision with two slots sharing the same name in different intents...
    }

    this.newComplexs[name] = {
      id: name,
      name,
      type: 'complex',
      list_entities: [],
      pattern_entities: [],
      examples: []
    }

    return name
  }

  buildNewComplex(allEntities: string[]) {
    const entities = allEntities.filter(e => e !== 'any')

    const name = this.makeName(entities)
    if (!!this.newComplexs[name]) {
      return name
    }

    const getEntitiesOfType = (type: 'list' | 'pattern') => {
      return this.entities
        .filter(e => e.type === type)
        .filter(e => entities.includes(e.name))
        .map(e => e.name)
    }

    const list_entities = getEntitiesOfType('list')
    const pattern_entities = getEntitiesOfType('pattern')
    const newEntity: sdk.NLU.EntityDefinition = {
      id: name,
      name,
      type: 'complex',
      list_entities,
      pattern_entities,
      examples: []
    }
    this.newComplexs[name] = newEntity

    return name
  }

  appendExample(entity: string, example: string) {
    const examples = this.newComplexs[entity]?.examples
    if (examples && !examples.includes(example)) {
      examples.push(example)
    }
  }

  getNewComplexs(): sdk.NLU.EntityDefinition[] {
    return Object.values(this.newComplexs)
  }

  makeName(entities: string[]): string {
    return _(entities)
      .filter(e => e.length)
      .sortBy()
      .value()
      .join('_')
  }
}

const migrateOneIntent = (complexCreator: ComplexEntityCreator) => async (intent: OldIntent) => {
  for (const slot of intent.slots) {
    let entity: string
    if (slot.entities.length === 1 && slot.entities[0] === 'any') {
      entity = complexCreator.buildNewComplexFromSlotAny(slot.name) // build entity from slot name
    } else if (slot.entities.length > 1) {
      entity = complexCreator.buildNewComplex(slot.entities)
    } else {
      entity = slot.entities[0]
    }
    slot.entity = entity
  }

  const utteranceUpdater = migrateOneUtterance(complexCreator, intent)
  intent.utterances = _.mapValues(intent.utterances, utts => utts.map(utteranceUpdater))

  for (const slot of intent.slots) {
    delete slot.entities
  }

  return intent
}

const migrateOneUtterance = (complexCreator: ComplexEntityCreator, intent: OldIntent) => (utt: string) =>
  utt.replace(ALL_SLOTS_REGEX, (_wholeMatch: string, slotExample: string, slotName: string) => {
    const slotEntities = intent.slots.find(s => s.name === slotName)?.entities

    if (slotEntities) {
      const isOnlyAny = slotEntities.length === 1 && slotEntities[0] === 'any'
      const newComplex = isOnlyAny ? slotName : complexCreator.makeName(slotEntities.filter(e => e !== 'any'))
      complexCreator.appendExample(newComplex, slotExample)
    }

    return `$${slotName}`
  })
