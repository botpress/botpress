/**
 * Verify if the specified intent has matched
 * @hidden true
 * @param intentName The name of the intent
 * @param intentSlots The slots to fill
 */
const slotFill = async (intentName, intentSlots) => {
  console.log('intent', intentName, 'slots', intentSlots)
  intentSlots = intentSlots.split(',') // Array params are comma-separated

  if (event.nlu.intent.name === intentName) {
    temp.partialMatch = 'true'

    console.log('Matched!')

    for (const key of Array.from(Object.keys(event.nlu.slots))) {
      const slot = event.nlu.slots[key]
      // Make sure we don't override the value
      if (!session[slot.name]) {
        session[slot.name] = slot.value
        console.log('Slot found!!')
      }
    }

    const slotsFilled = intentSlots.filter(slot => session[slot] !== undefined)
    // FIXME: Weak array compare
    if (slotsFilled.length === intentSlots.length) {
      console.log('Fully extracted')
      temp.completeMatch = 'true'
    }
  }
}

return slotFill(args.intentName, args.intentSlots)
