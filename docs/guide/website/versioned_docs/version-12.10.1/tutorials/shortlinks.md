---
id: version-12.10.1-shortlinks
title: Shortlinks
original_id: shortlinks
---

In Botpress you can natively create shortlinks to your bot.

This has a number of advantages:

1. Short URLs - no one likes a long URL
2. Flexibility - it allows you to change any of the parameters without affecting the URL

Below is an example where our new shortlink `/s/fs-wc` will redirect a user to `/lite/botId?m=platform-webchat&v=fullscreen` (the standard webchat interface) with any additional parameters you specify in the options object.

Create a bot-scoped after_bot_mount hook with this:

```js
bp.http.createShortLink('fs-wc', `${process.EXTERNAL_URL}/lite/${botId}/`, {
  m: 'channel-web',
  v: 'fullscreen',
  options: JSON.stringify({
    config: {
      /* Custom config here... */
    }
  })
})
```

See the views' [Config](https://github.com/botpress/botpress/blob/master/modules/channel-web/src/views/lite/typings.d.ts#L130) object for all available options.

It is recommended to also create a hook after_bot_unmount, to remove the shortlink when the bot is disabled; here is the corresponding example:

```js
bp.http.deleteShortLink('fs-wc')
```
