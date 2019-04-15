/**
 * Extract entities that match a slot
 * @hidden true
 * @param slotName The name of the slot to extract. (e.g. destination_from)
 * @param entityName The entity of the slot. (e.g. City)
 */
const slotFill = async (slotName, entityName) => {
  if (event.nlu.entities && event.nlu.entities.length) {
    for (const entity of event.nlu.entities) {
      if (entity.name === entityName) {
        setSlot(slotName, entity.data.value)
      }
    }
  } else if (entityName === 'any') {
    setSlot(slotName, event.payload.text)
  }
}

const setSlot = (slotName, value) => {
  if (!session.extractedSlots[slotName]) {
    session.extractedSlots[slotName] = {
      value,
      timestamp: Date.now()
    }
    session.extractedSlots.notFound = 0
  }
}

return slotFill(args.slotName, args.entity)
