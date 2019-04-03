const extractSlots = async (slotName, entity) => {
  // extract slots of current entity if available
  // we should fill the slots relative to the intent whenever we can
  for (const key of Array.from(Object.keys(event.nlu.slots))) {
    // Make sure we extract slots relative to the intent and we do not extract
    const slot = event.nlu.slots[key]
    if (slot.entity.name === entity) {
      if (!session[slot.name]) {
        // Make sure we don't override the value
        session[slot.name] = slot.value
      }
    }
  }
}

return extractSlots(args.slotName, args.entity)
