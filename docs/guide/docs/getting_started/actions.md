---
id: actions
title: Actions
---

## How actions work

Actions are essentially _server-side functions_ that get executed by the bot as part of a conversational flow. Actions have the power to do many things:

- Alter the state of the conversation
- Send customized messages to the conversation
- Execute arbitrary code like calling an API or storing data in the database

Since they are just regular JavaScript functions, they can, in fact, do pretty much anything.

When an action is invoked by the Dialogue Manager (DM), it gets passed the following arguments:

- **`state`**: The current state of the conversation. **This object is [`frozen`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) and can't be mutated.**
- **`event`**: The original (latest) event received from the user in the conversation. **This object is [`frozen`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) and can't be mutated.**
- **`args`**: The arguments that were passed to this action from the Visual Flow Builder.

The action itself **must return a new state object**.

Actions are run in a virtual machine, so scripting errors won't bring your bot down.

## How to define new actions

You may add actions globally or for a specific bot by adding a `.js` file in the folder `data/global/actions` or `data/bots/{bot_name}/actions`.
Actions may be added or edited at runtime without restarting the bot.

JSDoc comments before the function can be used to describe the action and prepopulate parameters when it is picked in the flow editor.
Usage is pretty straightforward:

```js
/**
 * Some description of what this action does
 * @title Sets a tag for the user
 * @category MyActions
 * @param {string} tag - A parameter named tag
 * @param {string} [expiry=never] - Sets a default value
 */
```

## Examples of action

And lastly, let's look at the `setUserVariable` action which makes use of custom arguments passed to the function from the flow.

```js
/**
 * Sets user Tag.
 * @param {string} args.name - Name of the tag.
 * @param {string} args.value - Value of the tag.
 */
setUserTag: async (state, event, { name, value }) => {
  await event.bp.users.tag(event.user.id, name, value)
  return { ...state }
},
```

> **Note:** `name` and `value` come from the Flow Builder. `name` is a static value whereas `value` is an expression that will be evaluated at execution time. In this case, `event.text` is what the user said (i.e., his nickname).

If the some variable is available under `state` or `event` in the action normally it doesn't make sense to pass it as custom arguments.

![Passing arguments from the flow editor](assets/setUserTagArgs.jpg)

## Altering the state

You **must** return a new state object. You can't modify the original state object as it is frozen. To return a new state object, clone the original state by using [`Object.assign()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign) or the [ES6 spread operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax).

### Examples

```js
// Adding properties using the spread operator
return { ...state, nickname: 'Jackob' }

// Removing properties using the spread operator
const clone = { ...state }
delete clone.nickname
return clone
```

### Non-altering actions

If your action does not modify the state, just return nothing (`return`). You can also return a clone of the original state: `return {...state}`.
