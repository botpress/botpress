# Wrapping tools

Clones a tool, extends its output schema, and delegates to the original handler before adding a confirmation number. The worker uses the wrapped tool and returns that number through a typed exit.

From `packages/llmz/examples`, after the [shared setup](../README.md):

```sh
pnpm start 19_worker_wrap_tool
```

The greeting and confirmation are simulated. The original tool is invoked once through the wrapper.

![Wrapping tools demo](./demo.svg)
