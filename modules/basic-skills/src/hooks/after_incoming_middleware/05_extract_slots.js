const _ = require('lodash')

// Make sure slots exists exists
event.state.session.slots = event.state.session.slots || {}
handleSlotsExpiry()
extractIntentSlots()

function extractIntentSlots() {
  let slots = _.flatten(_.values(event.nlu.slots)).filter(x => !!x.value) // only non-null slots
  // this hook comes after ndu as passed so last_topic is the current topic
  // see ndu-engine around line #308
  const currentTopic = _.get(event, 'state.session.nduContext.last_topic')
  if (event.ndu && currentTopic) {
    slots = _.chain(event)
      .get(`nlu.predictions.${currentTopic}.intents`, [])
      .orderBy('confidence', 'desc')
      .head()
      .get('slots', {})
      .values()
      .filter(s => !!s.value)
      .value()
  }
  for (let slot of slots) {
    // BETA(11.8.4): Prevent overwrite of the slot if explicitly demanded
    if (event.state.session.slots[slot.name] && event.state.session.slots[slot.name].overwritable == false) {
      continue
    }

    // Slot is an array when the NLU is confused about the results
    // The array is sorted by confidence so we take the first index
    if (Array.isArray(slot)) {
      slot = slot[0]
    }

    event.state.session.slots.notFound = 0
    event.setFlag(bp.IO.WellKnownFlags.FORCE_PERSIST_STATE, true)
    event.state.session.slots[slot.name] = {
      ...slot,
      timestamp: Date.now(),
      turns: 0,
      overwritable: true,
      expiresAfterTurns: false // BETA(11.8.4): Set this to a number to expire the slot after 'N' turns
    }
  }
}

function handleSlotsExpiry() {
  for (let slot of _.values(event.state.session.slots)) {
    if (typeof slot.turns === 'number') {
      ++slot.turns
    }

    const turnExpiry = slot.expiresAfterTurns
    if (typeof turnExpiry === 'number' && turnExpiry > -1 && slot.turns >= turnExpiry) {
      delete event.state.session.slots[slot.name]
    }
  }
}
