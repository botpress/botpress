/**
 * Extract entities that match a slot
 * @hidden true
 * @param slotName The name of the slot to extract. (e.g. destination_from)
 * @param entitiesName The entities of the slot. (e.g. City)
 */
const slotFill = async (slotName, entitiesName, turnExpiry) => {
  const entities = entitiesName.split(',')
  if (entities && entities.length && event.nlu.entities && event.nlu.entities.length) {
    for (const entity of event.nlu.entities) {
      if (entities.includes(entity.name)) {
        setSlot(slotName, entity)
      }
    }
  } else if (entities && entities.includes('any')) {
    const value = event.payload.text || event.preview
    const entity = {
      name: 'any',
      type: 'any',
      meta: { start: 0, end: value.length },
      data: { extras: {}, value: value }
    }
    setSlot(slotName, entity, turnExpiry)
  }
}

const setSlot = (slotName, entity, turnExpiry) => {
  if (!session.slots[slotName]) {
    session.slots[slotName] = {
      name: slotName,
      value: entity.data.value,
      entity: entity,
      timestamp: Date.now(),
      turns: 0,
      overwritable: true,
      expiresAfterTurns: turnExpiry
    }
    session.slots.notFound = 0
  }
}

return slotFill(args.slotName, args.entities, args.turnExpiry)
