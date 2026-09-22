# Basic chat

A conversational loop using `Chat`, `Session`, and `execute`. Ordinary assistant text is delivered through `response.handler`; suggested replies use the built-in buttons component.

From `packages/llmz/examples`, after the [shared setup](../README.md):

```sh
pnpm start 01_chat_basic
```

The first turn should display an assistant greeting followed by three topic buttons. Choosing a topic produces a short text reply with follow-up buttons. You can also type your own question.

This demo defaults to `openai:gpt-5.6-luna`, verified to produce text and button calls together. Set `BOTPRESS_MODEL` to try another model. The `best` selector currently resolves to GPT-5.2, which omitted the greeting in live checks even with explicit instructions; a button-only response contains no text for `response.handler` to display.

![Basic chat demo](./demo.svg)
