# Retrieval with citations

Uploads three synthetic documents to Botpress Files, waits for those exact files to finish indexing, and searches them through a tool. `ThinkSignal` exposes retrieved passages to the next model response. `CitationsManager` links source tags to the rendered answer.

From `packages/llmz/examples`, after the [shared setup](../README.md):

```sh
pnpm start 20_chat_rag
```

Use a development bot. This example upserts real files under `llmz-examples/rag/` and leaves them available for subsequent runs. Indexing can take time; the script reports indexing failures and times out after ten minutes.

![Retrieval with citations demo](./demo.svg)
