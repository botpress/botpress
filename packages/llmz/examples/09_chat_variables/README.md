# Validated object properties

Exposes a writable user profile with schemas for name, age, and email. Successful property traces update the host-side profile used for the next iteration. Invalid assignments are rejected by the property schema.

From `packages/llmz/examples`, after the [shared setup](../README.md):

```sh
pnpm start 09_chat_variables
```

Try an invalid email or an age outside the example’s 18–40 range. That range is an illustrative constraint, not a general registration policy.

![Validated object properties demo](./demo.svg)
