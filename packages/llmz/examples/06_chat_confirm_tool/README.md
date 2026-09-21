# Host-controlled confirmation

The overwrite tool asks the terminal user for confirmation before calling its handler. Only the exact input `OVERWRITE` approves the operation. A model-supplied flag or an earlier request does not authorize a later call.

From `packages/llmz/examples`, after the [shared setup](../README.md):

```sh
pnpm start 06_chat_confirm_tool
```

Ask the agent to overwrite data. Decline once, then approve a second attempt. The operation is simulated and does not modify storage.

![Host-controlled confirmation demo](./demo.svg)
