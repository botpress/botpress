---
layout: guide
---

Botpress web channel supports variety of message-types that can be rendered to the user. But it also supports custom message types that you can implement on your own via webchat-extensions.

Webchat-extension is a special kind of botpress-module that:
1. Is marked as webchat-plugin in `botpress`-section of `package.json` via `isPlugin` flag
2. Exports React-component through global `window.botpress` variable

Let's say we want to implement select-box webchat-plugin that allows user to select an option from a drop-down menu. For it we'd need to create an botpress-module. Please refer first step of [Creating modules](/docs/recipes/modules) recipe to initilize new module.

Once this is done, you'd need to update your `package.json` to convert you botpress-module to webchat-plugin. Here's how `botpress` section may look like:

```json
{
  "botpress": {
    "webBundle": "bin/web.bundle.js",
    "noInterface": true,
    "isPlugin": true,
    "plugins": [{ "entry": "Entry", "position": "overlay" }]
  }
}
```

Select-box plugin index.js file could look something like this:

```js
export const Plugin = ({ slots, id, onSendData }) => {
  const handleChange = e => {
    onSendData({
      type: "text",
      text: `Selected ${e.target.value} date-time`,
      data: { date: e.target.value, messageId: id }
    });
  };

  return (
    <select onChange={handleChange}>
      {(slots || []).map((slot, i) => (
        <option value={slot} key={i}>
          {slot}
        </option>
      ))}
    </select>
  );
};

export const Entry = () => null;
```

`Plugin` is a React-component that gets used to render actual content in the webchat.

`Entry` refers entry-point of our plugin that get's executed during botpress initialization on the client. Potentially it can be used for adding something to initialization procedure.

That's it, you can now use `@botpress-webchat-plugin-calendar` type in renderers for web-channel:

```js
'#select': data => ({
  text: 'Select option',
  type: '@botpress/new-module',
  data: { slots: data }
})
```

