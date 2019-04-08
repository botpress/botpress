/**
 * Extract entities that match a slot
 * @hidden true
 * @param slotName The name of the slot to extract. (e.g. destination_from)
 * @param entity The entity of the slot. (e.g. City)
 */
const slotFill = async (slotName, entity) => {
  if (Array.isArray(event.nlu.entities)) {
    for (const e of event.nlu.entities) {
      if (e.name === entity) {
        if (!session.extractedSlots[slotName]) {
          session.extractedSlots[slotName] = e.data.value
          session.extractedSlots.notFound = 0
        }
      }
    }
  }
}

return slotFill(args.slotName, args.entity)
