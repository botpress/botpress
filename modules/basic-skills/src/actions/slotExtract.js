/**
 * Extract the slots of a intent that matched
 * @private
 * @param entity The entity to extract slots from
 */
const slotExtract = async entity => {
  for (const key of Array.from(Object.keys(event.nlu.slots))) {
    const slot = event.nlu.slots[key]
    if (slot.entity.name === entity) {
      // Make sure we don't override the value
      if (!session[slot.name]) {
        session[slot.name] = slot.value
        session.notFound = 0
      }
    }
  }
}

return slotExtract(args.entity)
