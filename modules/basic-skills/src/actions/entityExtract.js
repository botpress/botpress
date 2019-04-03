const entityExtract = async (slotName, entity) => {
  // extract entities that match the provided slot if available
  if (Array.isArray(event.nlu.entities)) {
    for (const e of event.nlu.entities) {
      console.log(e.name, e.data.value)
      if (e.name === entity) {
        if (!session[slotName]) {
          session[slotName] = e.data.value
        }
      }
    }
  }
}

return entityExtract(args.slotName, args.entity)
