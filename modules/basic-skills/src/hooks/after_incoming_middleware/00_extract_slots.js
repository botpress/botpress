/**
 * Save all the extracted slots in the session
 */
const slotExtract = async () => {
  // Make sure extractedSlots exists
  if (!event.state.session.extractedSlots) {
    event.state.session.extractedSlots = {}
  }

  if (!event.nlu.slots) {
    return
  }

  for (const key of Object.keys(event.nlu.slots)) {
    let slot = event.nlu.slots[key]
    // Slot is an array when the NLU is confused about the results.
    // The array is sorted by confidence so we take the first index.
    if (Array.isArray(slot)) {
      slot = slot[0]
    } // Make sure we don't override a previous slot

    if (!event.state.session.extractedSlots[slot.name]) {
      event.setFlag(bp.IO.WellKnownFlags.FORCE_PERSIST_STATE, true)
      event.state.session.extractedSlots[slot.name] = {
        value: slot.value,
        timestamp: Date.now()
      }
      event.state.session.extractedSlots['notFound'] = 0
    }
  }
}

return slotExtract()
