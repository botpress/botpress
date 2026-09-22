# Error recovery

The `getCode` tool rejects an incorrect argument and explains the required value. LLMz reports the error to the model, which can generate a corrected call and complete with the returned code.

From `packages/llmz/examples`, after the [shared setup](../README.md):

```sh
pnpm start 17_worker_error_recovery
```

Recovery depends on the model and execution budget; it is not an unconditional retry guarantee. No external service is modified.

![Error recovery demo](./demo.svg)
