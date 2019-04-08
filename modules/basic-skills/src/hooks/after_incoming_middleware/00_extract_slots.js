/**
 * Save all the extracted slots in the session
 */
const slotExtract = async () => {
  // Make sure extractedSlots exists
  if (!event.state.session.extractedSlots) {
    event.state.session.extractedSlots = {}
  }

  for (const key of Array.from(Object.keys(event.nlu.slots))) {
    const slot = event.nlu.slots[key]

    // Make sure we don't override the value
    if (!event.state.session.extractedSlots[slot.name]) {
      event.setFlag(bp.IO.WellKnownFlags.FORCE_PERSIST_STATE, true)
      event.state.session.extractedSlots[slot.name] = slot.value
      event.state.session.extractedSlots['notFound'] = 0
    }
  }
}

return slotExtract()
