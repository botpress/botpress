const _ = require('lodash')

/**
 * Appends the provided context(s) to the list of contexts that will be used by the NLU Engine
 * for the next messages for that chat session.
 *
 * The TTL (Time-To-Live) represents how long the contexts will be valid before they are automatically removed.
 * For example, the default value of `1` will listen for that context only once (the next time the user speaks).
 *
 * If a context was already present in the list, the higher TTL will win.
 * To force override a specific context, use the `removeContext` action before this action.
 *
 * This method is contextual to the current user and chat session.
 *
 * You can specify more than one context by separating them with a comma.
 *
 * @title Append Context
 * @category NLU
 * @author Botpress, Inc.
 * @param {string} contexts - Comma-separated list of contexts
 * @param {string} [ttl=1] - Time-To-Live of the context in number of dialog turns. Put `0` to disable expiry.
 */
const appendContext = (contexts, ttl) => {
  const existing = event.state.session.nluContexts || []
  const add = contexts.trim().split(',')
  const merged = [
    ...existing,
    ...add.map(x => ({
      context: x,
      ttl: isNaN(Number(ttl)) ? 1000 : Number(ttl)
    }))
  ]

  const final = []
  const visited = {}
  for (const ctx of merged) {
    if (visited[ctx.context]) {
      continue
    }
    final.push(
      _.chain(merged)
        .filter(x => x.context === ctx.context)
        .orderBy('ttl', 'desc')
        .first()
        .value()
    )
    visited[ctx.context] = true
  }

  event.state.session.nluContexts = final
}

return appendContext(args.contexts, args.ttl)
