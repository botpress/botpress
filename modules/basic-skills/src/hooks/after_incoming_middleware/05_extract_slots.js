const _ = require('lodash')

// Make sure extractedSlots exists
event.state.session.extractedSlots = event.state.session.extractedSlots || {}
handleSlotsExpiry()
extractIntentSlots()

function extractIntentSlots() {
  const slots = _.flatten(_.values(event.nlu.slots)).filter(x => !!x.value) // only non-null slots
  for (let slot of slots) {
    // BETA(11.8.4): Prevent overwrite of the slot if explicitely demanded
    if (
      event.state.session.extractedSlots[slot.name] &&
      event.state.session.extractedSlots[slot.name].overwritable == false
    ) {
      continue
    }

    // Slot is an array when the NLU is confused about the results
    // The array is sorted by confidence so we take the first index
    if (Array.isArray(slot)) {
      slot = slot[0]
    }

    event.state.session.extractedSlots.notFound = 0
    event.setFlag(bp.IO.WellKnownFlags.FORCE_PERSIST_STATE, true)
    event.state.session.extractedSlots[slot.name] = {
      ...slot,
      timestamp: Date.now(),
      turns: 0,
      overwritable: true,
      expiresAfterTurns: false // BETA(11.8.4): Set this to a number to expire the slot after 'N' turns
    }
  }
}

function handleSlotsExpiry() {
  for (let slot of _.values(event.state.session.extractedSlots)) {
    if (typeof slot.turns === 'number') {
      ++slot.turns
    }

    // BETA(11.8.4): Automatically expire the slot after X dialog turns
    if (typeof slot.expiresAfterTurns === 'number' && slot.turns >= slot.expiresAfterTurns) {
      delete event.state.session.extractedSlots[slot.name]
    }
  }
}
