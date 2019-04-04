if (event.state && event.state.session && event.state.session.nluContexts) {
  if (event.nlu && !event.nlu.errored) {
    event.state.session.nluContexts.forEach(x => --x.ttl)
    // Remove contexts that have expired
    event.state.session.nluContexts = event.state.session.nluContexts.filter(x => x.ttl > 0)
  }
}
