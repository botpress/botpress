# Minimal worker

Runs a numerical task without a chat interface. The model must execute JavaScript and complete through the built-in `done` exit. The example prints the generated code and structured result.

From `packages/llmz/examples`, after the [shared setup](../README.md):

```sh
pnpm start 11_worker_minimal
```

It computes the sum of integers from 14 through 1078 divisible by 3, 9, or 5. Generation latency depends on the provider; the calculation itself runs locally.

![Minimal worker demo](./demo.svg)
