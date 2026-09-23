# Streaming Chat — guided simulation

A "space travel agency" that shows everything an execution produces, rendered live in the terminal:

- **Streamed messages** — `Chat.onMessageDelta` fires with each body chunk while the LLM is still generating (`{ id, component, props, delta, content }`); print `delta` keyed by `id` for a typewriter effect. `handler` stays the authoritative delivery (and the only one for body-less components like buttons).
- **Generated code** — the `onTrace` hook receives an `llm_call_success` trace carrying the code the LLM wrote; the example renders it in a box before it runs.
- **Live tool calls** — `tool_call` traces render as `⚙ tool(input) → output (ms)` inline in the transcript as they complete.
- **Chained tools** — booking is a two-step process: `bookTrip` only reserves, and `processPayment` must pay the reservation to obtain the confirmation id the `booked` exit requires. The agent chains both (plus `checkAvailability`) in a _single_ generated code block — something JSON tool-calling would need multiple roundtrips for.
- **Typed exits** — `booked` and `cancelled` exits with zui schemas; `result.is(exit)` narrows the payload for a typed end-of-conversation banner. The built-in `ListenExit` keeps the loop going.
- **Stats footer** — after every turn: model, total turns, iterations, code generation time, tokens in/out and time-to-first-token, read from `result.iteration.llm` and `result.iteration.tokens`.

Streaming requires a `CognitiveBeta` (Cognitive v2) client. The same pattern works for any transport — replace the `process.stdout.write`/`console.log` calls with websocket sends or SSE writes to stream to a frontend.

Sample turn:

```
👤 User: Book the Moon on the first available date. My name is Sylvain Perron.
🤖 Agent: Got it — Moon trip for Sylvain Perron. Let me line up the earliest launch…
   ┌─ generated code
   │ const dates = await checkAvailability({ destination: "moon" })
   │ const reservation = await bookTrip({ destination: "moon", date: dates[0], travelerName: "Sylvain Perron" })
   │ const payment = await processPayment({ reservationId: reservation.reservationId })
   │ return { ...payment, date: dates[0] }
   └─
   ⚙ checkAvailability({"destination":"moon"}) → ["2026-09-14",…] (0ms)
   ⚙ bookTrip({"destination":"moon",…}) → {"reservationId":"RSV-MOO-3645","totalUsd":125000} (0ms)
   ⚙ processPayment({"reservationId":"RSV-MOO-3645"}) → {"confirmationId":"SP-MOO-3645",…} (0ms)
🤖 Agent: All set — you're booked for the Moon! Confirmation SP-MOO-3645.
   ─ model openai:gpt-5.2 · turns 2 · iterations 2 · code generation 1764ms · tokens in 3,360 · tokens out 109 · ttft 663ms

🎫 Trip booked!
```
