---
layout: guide
---

## How actions work

Actions are essentially *server-side functions* that get executed by the bot as part of a conversational flow. Actions have the power to do many things:

- Alter the state of the conversation
- Send customized messages to the conversation
- Execute arbitrary code like calling an API or storing data in the database

Since they are just regular javascript functions, they can in fact do pretty much anything.

When an action is invoked by the Dialogue Manager (DM), it gets passed the following arguments:

- **`state`**: The current state of the conversation. **This object is [`frozen`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) and can't be mutated.**
- **`event`**: The original (latest) event received from the user in the conversation. **This object is [`frozen`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) and can't be mutated.**
- **`args`**: The arguments that was passed to this action from the Visual Flow Builder.

The action itself **must return a new state object**.

## How to define new actions

In the context of our tutorial, all actions are defined in our `src/actions.js` file and are registered in `src/index.js` as follows:

```js
bp.dialogEngine.registerFunctions(actions)
```

`registerFunctions(map)` takes a map as parameter, the keys being the name of the action and the value the action function. You can call `registerFunctions` as many times as you want, which allows you to split your actions into multiple files if you wish to.

## Examples of actions

Let's have a look at the `startGame` action. This action is very simple: it takes the `state` as parameter and returns a new state that marks the beginning of a new game.

```js
startGame: state => {
  return {
    ...state, // we clone the existing state
    count: 0, // we then reset the number of questions asked to `0`
    score: 0  // and we reset the score to `0`
  }
},
```

Now let's look at a slightly more complicated action.

The `sendRandomQuestion` action does the following:
- It sends a random *Content Element* from the `trivia` *Content Types* using the built-in `event.reply` method
- It captures that message sent to the user
- It extracts the good answer from the multiple choices
- It stores the good answer in the state

```js
sendRandomQuestion: async (state, event) => {
  // The `-random()` extension picks a random element in all trivia Q's
  // We also retrieve the message we just sent
  // Notice that `event.reply` is asynchronous, so we need to `await` it
  const messageSent = await event.reply('#!trivia-random()')

  // We find the good answer
  const goodAnswer = _.find(messageSent.context.choices, { payload: 'TRIVIA_GOOD' })

  return {
    ...state, // We clone the state
    isCorrect: null, // We reset `isCorrect` (optional)
    count: state.count + 1, // We increase the number of questions we asked so far
    goodAnswer // We store the goodAnswer in the state
  }
},
```

And lastly, let's look at the `setUserTag` function which makes use of custom arguments passed to the function from the flow.

```js
setUserTag: async (state, event, { name, value }) => {
  await event.bp.users.tag(event.user.id, name, value)
  return { ...state }
},
```

`name` and `value` come from the flow builder:

![Passing arguments from the flow editor][setUserTagArgs]

## Altering the state

You **must** return a new state object, you can't modify the original state object as it is frozen. To return a new state object, simply clone the original state by using [`Object.assign()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign) or the [ES6 spread operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax).

### Examples

```js
// Adding properties using the spread operator
return { ...state, nickname: 'Jackob' }

// Removing properties using the spread operator
const clone = {...state}
delete clone.nickname
return clone
```

### Non-altering actions

If you action does not modify the state, simply return nothing (`return`). You can also return a clone of the original state: `return {...state}`.

[setUserTagArgs]: {{site.basedir}}/images/setUserTagArgs.jpg