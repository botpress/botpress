import { NLU } from 'botpress/sdk'

type NewIntentDefinition = Omit<NLU.IntentDefinition, 'slots'> & {
  slots: NLU.SlotDefinition[]
}

export function mapLegacySlots(intentDefs: NLU.IntentDefinition[], entityDefs: NLU.EntityDefinition[]) {
  const patterns = entityDefs.filter(e => e.type === 'pattern')
  const enums = entityDefs.filter(e => e.type === 'list')
  const systems = entityDefs.filter(e => e.type === 'system')
  const complexs: NLU.EntityDefinition[] = []

  const newIntents: NewIntentDefinition[] = []
  for (const intent of intentDefs) {
    const newSlots: NLU.SlotDefinition[] = []
    for (const slot of intent.slots) {
      let newSlot: NLU.SlotDefinition
      if (isLegacySlot(slot)) {
        newSlot = { name: slot.name, entity: slot.name }

        const pattern_entities = slot.entities.filter(e => patterns.map(p => p.name).includes(e))
        const list_entities = slot.entities.filter(e => enums.map(p => p.name).includes(e))
        const system_entities = slot.entities.filter(e => systems.map(p => p.name).includes(e))

        complexs.push({
          id: makeEntityId(slot.name),
          name: slot.name,
          type: 'complex',
          list_entities,
          pattern_entities,
          system_entities,
          examples: [] // no examples required as legacy utterances uses markdown notation
        })
      } else {
        newSlot = { ...slot }
      }

      newSlots.push(newSlot)
    }
    newIntents.push({ ...intent, slots: newSlots })
  }

  const newEntities = [...patterns, ...enums, ...systems, ...complexs]
  return { intentDefs: newIntents, entityDefs: newEntities }
}

function isLegacySlot(slot: NLU.SlotDefinition | NLU.LegacySlotDefinition): slot is NLU.LegacySlotDefinition {
  return !!(slot as NLU.LegacySlotDefinition).entities
}

function makeEntityId(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\t\s]/g, '-')
}
