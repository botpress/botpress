# Cooperative cancellation

An `AbortController` stops a counting program five seconds after its first wait call. The host wait tool receives the same signal and cancels its timer. A `finally` block clears the demonstration’s abort timer.

From `packages/llmz/examples`, after the [shared setup](../README.md):

```sh
pnpm start 13_worker_sandbox
```

Expect an aborted execution. Runtime cancellation does not undo host-side effects; tools that perform long operations should support cancellation themselves.

![Cooperative cancellation demo](./demo.svg)
