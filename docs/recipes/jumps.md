---
layout: guide
---

Flow-editor allows you to visually design the flow that bot follows. Sometimes though it may appear that it makes more and results into less code to have programmatic jumps to specific node under some conditions.

This can be done like this:

```js
// inside a bp.hear (...)
const stateId = event.sessionId || event.user.id;
bp.dialogEngine.jumpTo(stateId, 'main.flow.json', 'target-node', { resetState: true })
bp.dialogEngine.processMessage(stateId, event) // Continue processing
```

In the example above we pass to `bp.dialogEngine.jumpTo` stateId, flow name, optional node name (by default it's flow.startNode) and options-object with `resetState` key set to true (by default state doesn't get reset).

