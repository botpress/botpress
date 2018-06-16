---
layout: guide
---

Botpress web channel supports variety of message-types that can be rendered to the user. But it also supports cusomt message types that you can implement on your own via webchat-extensions.

Webchat-extension is a botpress-module that provides React-component to botpress through `window.botpress` global variable.

Let's say we want to implement select-box webchat-plugin that allows user to select an option from a drop-down menu. For it we'd need to create an npm-module with name starting with `botpress` and package.json containing `botpress`-section as follows:

```json
  "botpress": {
    "webBundle": "build/index.js", // Path to web-bundle of webchat-extension
    "noInterface": true,
    "isPlugin": true,
    "plugins": [
      {
        "entry": "Entry",
        "position": "overlay"
      }
    ]
  },
```

Select-box plugin index.js file could look something like this:

```js
const Plugin = ({ slots, id, onSendData }) => {
  const handleChange = (e) => {
    onSendData({
      type: 'text',
      text: `Selected ${e.target.value} date-time`,
      data: { date: e.target.value, messageId: id }
    })
  }

  return (
    <select onChange={handleChange}>
      {(slots || []).map((slot, i) => <option value={slot} key={i}>{slot}</option>)}
    </select>
  )
}

const Entry = () => null // Could be used for initialization

if (typeof window !== 'undefined') {
  window.botpress = window.botpress || {}
  window.botpress['botpress-webchat-plugin-calendar'] = { Plugin, Entry }
}
```

As you can notice we define `Plugin` and `Entry` functions which we than store in `window.botpress[<plugin-name>]` global variable.

That's it, you can now use `@botpress-webchat-plugin-calendar` type in renderers for web-channel.
You can also check [full example](https://github.com/botpress/botpress-webchat-plugin-calendar) of the plugin.
