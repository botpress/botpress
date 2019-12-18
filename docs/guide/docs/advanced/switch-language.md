---
id: switch-language
title: Switch language
---

## Overview

To switch current bot UI locale, use next code inside action or hook:

```js
const payload = bp.RealTimePayload.forVisitor(event.target, 'webchat.data', {
  payload: {
    language: 'ar'
  }
})
bp.realtime.sendPayload(payload)
```
