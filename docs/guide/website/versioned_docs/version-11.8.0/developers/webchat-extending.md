---
id: version-11.8.0-webchat-extending
title: Extending the webchat
original_id: webchat-extending
---

## The Basics

Every message sent by the bot to a user consist of a `payload`. That payload has a `type` property, that tells the webchat how the other informations included on that payload should be rendered on screen.

There are different ways to send that payload to the user:

- Sending a Content Element via the Flow Editor [example here](https://github.com/botpress/botpress/blob/master/modules/builtin/src/content-types/image.js)
- Sending an event via Hooks or Actions [example here](https://github.com/botpress/botpress/blob/master/examples/custom-component/src/hooks/after_incoming_middleware/sendoptions.js)

There are multiple types already built in Botpress (they are listed at the bottom of this page), but if you require more advanced components, you can create them easily.

### Prevent storing sensitive informations

By default, the complete payload is stored in the database, so the information is not lost when the user refreshes the page. On some occasion, however, we may want to hide some properties deemed "sensitive" (ex: password, credit card, etc..).

To remove those informations, there is a special property that you need to set: `sensitive`. Here's an example:

```js
const payload = {
  type: 'login_prompt',
  username: 'someuser',
  password: 'abc123',
  sensitive: ['password']
}

// This is the information that will be persisted: { type: 'login_prompt', username: 'someuser' }
```

## Creating a Custom Component

We already have an [example module](https://github.com/botpress/botpress/tree/master/examples/custom-component) showing how to create them, so we will just make a quick recap here.

Custom components leverages the `custom` payload type, which is

1. Create a module (we have [example templates here](https://github.com/botpress/botpress/tree/master/examples/module-templates))
2. Develop your component
3. Export your component in the `lite.jsx` file ([here's a couple of different ways to do it](https://github.com/botpress/botpress/blob/master/examples/custom-component/src/views/lite/index.jsx))
4. Send a custom payload to the user:

```js
payload: {
  type: 'custom' // Important, this is how the magic operates
  module: 'myModule' // The name of your module, must match the one in package.json
  component: 'YourComponent' // This is the name of the component, exported from lite.jsx
  // Feel free to add any other properties here, they will all be passed down to your component
  myCustomProp1: 'somemorestuff'
  someOtherProperty: 'anything'
}
```

### What can I do in my component ?

There are a couple of properties that are passed down to your custom component. These can be used to customize the displayed informations, and/or to pursue interactions.

| Property      | Description                                                                    |
| ------------- | ------------------------------------------------------------------------------ |
| ...props      | The payload properties are available on the root object (this.props.)          |
| onSendData    | This method can be used to send a payload to the bot on the behalf of the user |
| onFileUpload  | Instead of sending an event, this will upload the specified file               |
| sentOn        | This is the timestamp of the message.                                          |
| isLastGroup   | Indicates if your component is part of the group of messages sent by the bot   |
| isLastOfGroup | Indicates if your component is the last message in its group                   |
| keyboard      | This object allows you to manipulate the keyboard (more below)                 |
| wrapped       | Represent any child components (more below)                                    |

> isLastGroup and isLastOfGroup can be combined to let your component know if the current message is the last one the user is seeing. This can be used, for example, to display feedback buttons, a login form or anything else, that will disappear when the user continues the discussion.

#### Wrappers

Wrappers allows you to transform the content of a payload before passing it down to the renderer, or to another component. We have some [example components here](https://github.com/botpress/botpress/tree/master/examples/custom-component/src/views/lite/components/Advanced.jsx)

Here's an example of a wrapped text message:

```js
payload: {
  type: 'custom',
  module: 'myModule',
  component: 'MyComponent'
  wrapped: {
    type: 'text'
    text: 'Hello user!'
  }
}
```

It is also possible to chain multiple custom components using the `wrapped` property

#### Keyboards

Keyboard allows you to add elements before or after the composer. Keyboard items can be buttons, or any other type of valid component. Use `Keyboard.Prepend` to display it before the composer, and `Keyboard.Append` to display it after.

```js
...
render(){
  // First of all, import the keyboard object
  const Keyboard = this.props.keyboard

  // Create any type of component
  const something = <div>This will be displayed over the composer, as long as visible is true</div>

  // Your custom keyboard will only be displayed if that message is the last one displayed
  const visible = this.props.isLastGroup && this.props.isLastOfGroup

  return (
    <Keyboard.Prepend keyboard={something} visible={visible}>
      This text will be displayed in the chat window
    </Keyboard.Prepend>à
  )
}
```

##### Using a Button Keyboard

There is a built hook that makes it easy to add buttons to any kind of element. You can pass down an array of buttons, or an array of array of buttons.

```js
const payload = {
  type: 'text'
  text: 'hello',
  quick_replies: [
      [{ label: 'row 1, button 1', payload: 'something' }, { label: 'row 1, button 2', payload: 'something' }],
      [{ label: 'row 2, button 1', payload: 'something' }],
      [{ label: 'row 3, button 1', payload: 'something' }]
    ]
}
```
