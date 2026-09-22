# Browser integration tools

Wraps the Botpress browser integration in typed tools. `setStaticInputValues` fixes search count and browsing options while leaving the query to the model.

From `packages/llmz/examples`, after the [shared setup](../README.md):

```sh
pnpm start 05_chat_web_search
```

Enable the browser integration on your development bot first. This example makes real search and page-browsing requests through `browser:webSearch` and `browser:browsePages`.

![Browser integration tools demo](./demo.svg)
