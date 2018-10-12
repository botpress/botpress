---
layout: guide
---

The Botpress web channel supports a variety of message types that can be rendered to the user. There are a number of types that are available out-of-the-box, but Botpress also supports custom message types. Custom message types are implement via webchat-extensions.

A webchat-extension is a special kind of botpress-module that:
1. Is marked as webchat-plugin in `botpress` section of is `package.json` via the `isPlugin` flag
2. Exports a React-component through the global `window.botpress` variable

To create your webchat-extention you will need to initialize a new botpress-module. To do this please refer to the first step of the [Creating modules](/docs/recipes/modules) recipe.

Once you have initialize your botpress-module you will need to convert it into a webchat-plugin. Below is an example of how the `botpress` section may look like in your botpress-module's `package.json`:

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
In this recipe we will be creating a select webchat-plugin that allows the user to select an option from a drop-down menu.

Within the webchat-plugin's index.js file, you need to make a react component that looks something like this:

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

`Plugin` is a React-component that gets used to render the content in the webchat.

`Entry` refers to the entry point of your plugin that gets executed during your bot's initialization on the client. This can be used to add functions to the initialization process.  

That's it, you can now use your new module (`@botpress-webchat-plugin-select`) type in renderers for the web-channel:

```js
'#select': data => ({
  text: 'Select option',
  type: '@botpress/new-module',
  data: { slots: data.slots }
})
```

