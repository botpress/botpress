---
id: sdk
title: SDK  
---

--------------------

To access the SDK reference page, follow this link: https://botpress.com/reference/.

## jumpTo

The flow-editor allows you to visually design the flow of the conversation. However, it may be easier for you to jump to a specific conversation node programmatically, when a specific set of conditions is met.

```js
// This should be located inside a hook
const sessionId = bp.dialog.createId(event)
await bp.dialog.jumpTo(sessionId, event, 'main.flow.json', 'target-node')
```

As can be seen in the above example, the `jumpTo` method takes 4 arguments:

- the session id;
- the event;
- the target flow name;
- the target node name (optional - by default it is flow.startNode).
