# Single-tool protocol design

The single-tool design is implemented for the 1.0 protocol. The [protocol specification](native-protocol-spec.md) defines its behavior, and the [migration guide](native-protocol-migration.md) describes the breaking changes. The [validation report](native-protocol-rerun.md) separates the preceding multiple-native-tools baseline from targeted single-tool acceptance samples.

LLMz exposes one provider-native tool: `run_javascript({ code })`. Normal assistant text and provisional text streaming remain native. Business functions, rich presentation, inspection, and typed completion share one JavaScript program, avoiding a model's need to coordinate separate presentation and exit calls in one response. A response may contain at most one native call; independent business functions can still use `Promise.all` inside JavaScript.

## Exits and returned presentation decisions

```javascript
const account = await readAccount()
return exit('done', { accountId: account.id })
```

A worker can complete its business work and typed exit in one generation. Payloads are validated against the configured exit schema.

```javascript
return chat.buttons([
  { action: 'say', label: 'Standard' },
  { action: 'say', label: 'Premium' },
])
```

The assistant can stream the accompanying question normally. Returning this decision validates and delivers both buttons in order, then finishes with `ListenExit`. Other registered components use `return chat.present({ messages: [{ component, props, body }] })`.

```javascript
return inspect(await readAccount())
```

Inspection exposes the underlying value through `$return` and a bounded tool-result preview, then asks the model to continue. Plain returned values also continue. `exit()` finishes silently in chat mode. `await chat.send(messageOrArray)` sends nonterminal progress during the program.

`return exit(...)` remains the canonical form. The `exit(...)` call itself is terminal control flow: if return is omitted, a valid call still stops the compiled program, including helpers and surrounding catch/finally. Invalid names or payloads still raise ordinary validation errors. `inspect`, `chat.present`, and `chat.buttons` construct opaque decisions and still require an explicit return. Required memory settlement precedes terminal effects, and receipts do not overwrite the latest inspected result.

## Streaming and execution

A complete validated structured call can start JavaScript while the response stream remains open for workers and chats with `onMessageDelta`. Chats without a preview callback wait for the complete response and acceptance of any accompanying text by `Chat.handler` before starting JavaScript, preserving announced progress before business actions. Partial arguments never execute. The next iteration waits for both the stream and the program to settle.

Cognitive currently emits calls in its final chunk, so eligible executions can overlap transport draining. Adapters that expose complete calls earlier can start sooner. Before dispatch, fallback can discard provisional output and retry. After dispatch, stream failure or restart stops without automatic replay; completed effects and retained memory remain recorded.

## Validation

Deterministic checks cover the single-call boundary, returned decisions, ordered delivery, memory, snapshots, and streaming failure behavior. Live model tests must independently verify requested-route task completion and generation counts. The earlier baseline motivates the simplification but does not prove the new protocol's success rate.
