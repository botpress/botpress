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

  buildNewComplex(entities: string[]) {
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

    // TODO: get system entities and find a way to add them to the new complex.

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
    const isOnlyAny = slot.entities.length === 1 && slot.entities[0] === 'any'
    if (isOnlyAny || slot.entities.length > 1) {
      slot.entities = slot.entities.map(e => (e === 'any' ? slot.name : e)) // replace any by slot name
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
      const newComplex = complexCreator.makeName(slotEntities)
      complexCreator.appendExample(newComplex, slotExample)
    }

    return `$${slotName}`
  })
