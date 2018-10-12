---
id: jumps
title: Jump to
---

The flow-editor allows you to visually design the flow of the conversation. However, it may be easier for you to jump to a specific conversation node programmatically, when a specific set of conditions is met.

```js
// inside a bp.hear (...)
const stateId = event.sessionId || event.user.id
await bp.dialogEngine.jumpTo(stateId, 'main.flow.json', 'target-node', { resetState: true })
await bp.dialogEngine.processMessage(stateId, event) // Continue processing
```

As can be seen in the above example, the `jumpTo` method takes 4 arguments:

- the state id
- the target flow name
- the target node name (optional - by default it is flow.startNode)
- an options-object, with the `resetState` key set to true (by default state doesn’t get reset).
