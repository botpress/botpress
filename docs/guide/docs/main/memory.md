---
id: memory
title: Memory
---

In the course of a conversation, you may want to ask questions to the user, and remember his answers to use it later. You may also want to access the values of system parameters such as the values of the slots that were just extracted.

## System Parameters

When a user engages with a bot, Botpress tracks all the variables and parameters associated with that bot as the bot transitions from one state to another. If you run the emulator you will see the tree of all the system parameters that it tracks.

You can access these system parameters from the flow builder and from within your code (including in Actions). To do so, all you need to do to reference a parameter by prefixing the path shown in the emulator with “event.”.

For example, the path shown in the emulator to the language parameter is nlu.language. You can reference that parameter by adding “event.” to the path shown in the emulator i.e. event.nlu.language.

![NLU Language Emulator](../assets/nlu-language-emulator.png)

In the Flow Editor you can access system parameters by bracketing them with two sets of curly brackets.

For example in a message you could say:

The bot's language is {{event.nlu.language}}.

![NLU Language Message](../assets/nlu-language-message.png)

You can also set variables to be the value of a system parameter as follows:

![NLU Language Set Variable](../assets/nlu-language-set-variable.png)

For raw expressions or for code (such as in Actions) you don't need the curly brackets.

Here is an example of a raw expression in a transition:

![NLU Language Raw Expression](../assets/nlu-language-raw-expression.png)

Here is a code example where a temporary boolean variable (`temp.englishUser`) is set for all English speaking chatbot users:

```js
function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */


  /**
   * Small description of your action
   * @title Save English Users
   * @category Custom
   * @author Botpress
   */
  const setEnglishUser = async () => {
    try {
      const userLanguage = event.nlu.language

      // Make sure the order ID only contains numbers and is of length 10
      if (userLanguage == 'en') {
        temp.englishUser = true
      } else {
        temp.englishUser = false
      }
    } catch {
      temp.englishUser = false
    }
  }

  return setEnglishUser()

  /** Your code ends here */
}
```

In the same way as described above, it would be possible to access the values of extracted slots by copying the path from the emulator and prefixing it with "event." i.e. {{state.session.slots.food.value}} in the flow builder and state.session.slots.food.value in code. "food" is a slot that was set up intent by the bot builder.

![Slot Extraction Emulator](../assets/slot-extraction-emulator.png)

As is possible in Javascript, it is also possible to access the parameters with the systax `{{state.session.slots["food"].value}}`

The most commonly used system parameter is `event.payload.text`. Even though this system parameter does not appear in the emulator (its spellchecked version is available) it returns the last text received from the user.

## Variables

There are four different kind of memories in Botpress; the difference between each of them is the duration and the scope.

- `user` memory is kept forever for the user it is associated with.
- `session` memory is kept for the duration of the configured session (more on that below).
- `temp` memory is only kept for the duration of the flow.
- `bot` memory is the same value for all users of a same bot.

## Common Use Case

Most of the time, you will rely on the `user` and `temp` type of memory. The temp memory is only alive for the duration of a flow.

## Setting and accessing variables

Variables can be set up or declared either by using the Set Variable action (see Dialog Memory section below) or in code. When using the dialog for the Set Variable action the variable is set up and assigned a value.

In code the variable is declared simply using it. For example if you type **`temp.userName = "John"`** in code, the variable temp.user_name will be created and set to the value "John".

As with system parameters (see System Parameters section), variables can be accessed in the flow builder and the Set Variable dialog by bracketing the variables with double curly brackets `{{temp.userName}}` as follows:

![User Name Message](../assets/user-name-message.png)

In code or raw expresssions the reference to the variable would not need the double curly brackets. in the example below, two variable are referenced, `temp.user_name` and `temp.name_given`

```js
function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state) {
  /** Your code starts below */

  /**
   * Sets the temporary variables of the ticket with the slots when they exist
   * @title ticket-setTempVariables
   * @category Storage
   * @author Botpress
   */
  const myAction = async () => {
    bp.logger.info('ticket-setTempVariables.js')

    try {
      if (session.slots.userName) {
        temp.user_name = session.slots.userName.value
      } else {
        temp.name_given = false
      }
    } catch (e) {
      // do something with error
    }
  }

  return myAction()

  /** Your code ends here */
  ```

## Dialog Memory

The Dialog Memory is how your bot will remember things in the context of a conversation. The way you can store and retrieve data is by using Actions inside the flows. There are four types of memory available: **user**, **session**, **temp** and **bot**. The value of type in the Set Variable user interface must be set to one of these four types.

You can consume a memory action just like any other action from the Botpress Flow Editor.

##### Memory Action Example

![Flow Memory Action](../assets/flow-memory-action.png)

### User Memory

Variables set using the `user` namespace will be saved as attributes for the user. This means that those attributes will always follow the user, not notwithstanding conversations or time period.

When a user sends a message to the bot, the first middleware is tasked with loading that user's information. After everything is processed, any changes to the `user` object will be persisted to the database.

This means that you can alter the `user` object using middlwares and actions, and it will be saved at the end.

#### User Memory - Data Retention

Since privacy is an important matter, there is a built-in system that makes it dead-easy to set retention periods for different type of information. You could have, for example a policy that says `email expires after 2 months` or `remember user's mood for 1 day`. Whenever the user's attribute is changed, the expiration policy is updated.

Here's how it could be configured:

```js
//data/global/botpress.config.json

dataRetention: {
  janitorInterval: '2m', // Check each 2 mins for expired data
  policies: {
    email: '60d', // Keep email for 30 days, reset if it is changed
    mood: '1d' // Forget user's mood after 1 day
    someChoice: '5m' // Keeps the variable alive for 5 minutes
  }
}
```

### Session Memory

The `session` store is alive for the duration of the user's session. How long is that? Well, it depends on the setting of `sessionIntervalTimeout` in `botpress.config.json`.

This is also where we keep the last messages sent by the user. This information is used by the Decision Engine to better understand the user's will and to avoid repeating meaningless stuff.

### Temporary Memory

The `temp` memory is the most heavily type of memory used on Botpress. To keep it simple, this memory is kept since the beginning of flow until the end. As long as nodes are linked together, it will be available. If you were a user of Botpress 10.x, this was better known as the `state` of the dialog.

Common use case implies calling an action, saving the result in the `temp` memory, then send a content element including the answer to the user.

For example, you want to list the name of your servers, which should be fetched from an API.

This would be your action, fetch_servers.js:

```js
const listServers = async () => {
  try {
    const { data } = await axios.get(`https://mysite.com/servers`)
    temp.servers = data.servers.join(', ')
  } catch (error) {}
}

return listServers()
```

That action would fetch the name of your the servers, then you could send a content element similar to this:

`Here's the list of our servers: {{temp.servers}}`

As you can see, it's very easy to use !

### Bot Memory

The `bot` memory is the same value for all users of the bot. Think of it like a global variable, but scoped to this bot only.

## How to change what's in the memory?

There are two different ways to edit these 4 different types of data. The most simple way is to use the action `base.setVariable`. You only have to specify the type of memory, the name of the variable, and what value it should be set to.

Another common use is using actions. Actions allows you to edit these variables directly. For example, you could write `user.firstname = 'potato'` in your code file to update the user's name.

Please check out the [Custom Code](code#actions) section for more details about this.

## General Storage

What if the four previous types of storage doesn't fulfill my requirements? Don't worry, we still have other options!

The Key-Value Store is a general-purpose store which allows you to store any type of data. You will need to manage expirations and data update yourself, since Botpress will not update these values on its own.

The KVS is available from the [Botpress SDK](https://botpress.com/reference/modules/_botpress_sdk_.kvs.html)
