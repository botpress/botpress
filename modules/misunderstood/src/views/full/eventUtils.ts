export const groupEventsByUtterance = events => {
  const itemsByUtterance = new Map() // Using a Map here since it remembers the insertion order for keys
  events.forEach(function(event, eventIndex) {
    const { preview: utterance } = event
    if (!itemsByUtterance.has(utterance)) {
      itemsByUtterance.set(utterance, [{ event, eventIndex }])
    } else {
      itemsByUtterance.get(utterance).push({ event, eventIndex })
    }
  })
  return itemsByUtterance
}
