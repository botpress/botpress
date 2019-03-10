---
id: version-11.6.0-shortlinks
title: Shortlinks
original_id: shortlinks
---

In Botpress you can natively create shortlinks to your bot.

This has a number of advantages:

1. Short URLs - no one likes a long URL
2. Flexibility - it allows you to change any of the parameters without affecting the URL

Below is an example where our new shortlink `/s/fullscreen-webchat` will redirect a user to `/lite/bot123?m=platform-webchat&v=fullscreen` (the standard webchat interface) with any additional parameters you specify in the options object.

```js
bp.http.createShortlink('fullscreen-webchat', '/lite/bot123', {
  m: 'channel-web',
  v: 'fullscreen',
  options: JSON.stringify({
    config: {
      /* Custom config here... */
    }
  })
})
```
