---
layout: guide
---

You may have a situation with your bot where you require the user to input sensitive data via your bot. this could then pose a security risk if someone was to see the chat or gain access to your persistent data.

That is where data sanitization comes to the rescue! It allows you to define a regular expression for the data you are wanting to obfuscate and then checks each incoming message against this regex, replacing the data that matches.

Because you are replacing the `raw` and `text` properties on the object, when you persist the data it will be stored in it's new state, protecting it should someone gain access to it. 

Below is a sample code snippet where the regex is looking for credit card numbers in the format XXXX XXXX XXXX XXXX and replacing them with a string of *'s 

```js
if (bp.webchat) {
  bp.webchat.sanitizeIncomingMessage = payload => {
    if (payload.type !== 'text' || !payload.text) {
      return
    }
    const sensitiveRegex = /\b(\d[\d-_]{2,}\b)\b/g
    return {
      ...payload,
      __sensitive: payload.text.match(sensitiveRegex) || []
      text: payload.text.replace(sensitiveRegex. '*******')
    }
  }
}
```
> Note: This is currently only available in webchat

> Note: This requires `@botpress/channel-web` version 10.33.0 or later 