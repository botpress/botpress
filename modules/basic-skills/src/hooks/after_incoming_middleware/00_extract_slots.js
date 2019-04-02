// const extractSlots = async () => {
//   console.log('nlu', event.nlu)
//   console.log('args', args)

//   // extract slots of current entity if available
//   // we should fill the slots relative to the intent whenever we can
//   for (const key of Array.from(Object.keys(event.nlu.slots))) {
//     console.log('***** slot', key)
//     // Make sure we extract slots relative to the intent and we do not extract
//     const slot = event.nlu.slots[key]
//     console.log('***** slot extracted')
//     if (!session[slot.name]) {
//       // Make sure we don't override the value
//       session[slot.name] = slot.value
//     }
//   }
// }

// return extractSlots()
