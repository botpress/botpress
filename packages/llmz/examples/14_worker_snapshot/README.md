# Save and resume a session

Serializes a completed session with `JSON.stringify(session)`, restores it with `Session.fromJSON`, and appends a `shipping.requested` event. The second execution uses retained history and variables to report an already-paid order.

From `packages/llmz/examples`, after the [shared setup](../README.md):

```sh
pnpm start 14_worker_snapshot
```

The snapshot stays in memory; replace that string with database storage in an application. Re-register tools, exits, chat handlers, and credentials when resuming. Serialization does not capture executable handlers.

![Save and resume a session demo](./demo.svg)
