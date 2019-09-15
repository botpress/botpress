if (event.state && event.state.session && event.state.session.nluContexts && event.state.session.nluContexts.length) {
  event.nlu = event.nlu || {}

  Object.assign(event.nlu, {
    includedContexts: event.state.session.nluContexts.map(x => x.context)
  })
}
