# Agent handoffs

A small orchestrator selects HR, IT, Sales, or a general agent. Each agent exposes its own tools and instructions. Typed handoff exits select the next agent and queue an event in the shared session; repeated handoffs within one request are rejected.

From `packages/llmz/examples`, after the [shared setup](../README.md):

```sh
pnpm start 08_chat_multi_agent
```

Ask about benefits, technical support, or pricing. All business tools are simulated. A listening exit prompts for more input; an end-conversation exit stops the loop.

![Agent handoffs demo](./demo.svg)
