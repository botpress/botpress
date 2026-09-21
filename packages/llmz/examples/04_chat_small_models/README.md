# Model selection and ticket tools

A simulated ticket store exposes list, read, and close operations. The example defaults to `openai:gpt-5.6-luna`; set `BOTPRESS_MODEL` to compare a specific available model.

From `packages/llmz/examples`, after the [shared setup](../README.md):

```sh
pnpm start 04_chat_small_models
```

Try listing tickets, inspecting ticket 123, and closing it. All changes stay in memory.

![Model selection and ticket tools demo](./demo.svg)
