# Conditional tools

Instructions and available tools are recomputed from the current login state. The credentials are deliberately simulated: both `admin` and `customer` use `password`. Tools only print messages; there is no real database reset.

From `packages/llmz/examples`, after the [shared setup](../README.md):

```sh
pnpm start 03_chat_conditional_tool
```

Log in as each role, compare available tools, then log out. In an application, authenticate outside the model and enforce authorization inside every sensitive handler.

![Conditional tools demo](./demo.svg)
