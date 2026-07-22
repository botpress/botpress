# Streaming Chat

Streams agent responses to the terminal token-by-token as they are generated.

Two `Chat` hooks work together:

- **`onMessageDelta`** — fires with each chunk of a message body while the LLM is still generating (`{ id, component, props, delta, content }`). Print/forward `delta` keyed by `id` for a live typewriter effect.
- **`handler`** — fires once per complete message and remains the authoritative delivery (also the only one for body-less components like buttons, or when the client doesn't support streaming).

Streaming requires a `CognitiveBeta` (Cognitive v2) client. The same pattern works for any transport — replace the `process.stdout.write` calls with a websocket send or SSE write to stream to a frontend.
