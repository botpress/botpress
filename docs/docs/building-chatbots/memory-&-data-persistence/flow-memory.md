---
id: flow-memory
title: Flow Memory
---

--------------------

In a conversation, you may want to ask questions to the user and remember his answers to use them later. You may also want to access the values of system parameters, such as the values of the slots that your chatbot just extracted.

## System Parameters

When a user talks to a chatbot, Botpress tracks all variables and parameters associated with that chatbot as the chatbot transitions from one state to another. If you run the debugger, you will see the tree of all the system parameters that it tracks. Just click the debugger button (circled in red below) and it will open in the bottom panel by default.

![How to Access Debugger](/assets/access-debugger.png)

You can access these system parameters from the Flow Editor and within your code (including in actions). To do so, all you need to do to reference a parameter by prefixing the path shown in the emulator with `event.`.

For example, the path shown in the debugger to the language parameter is `nlu.language`. You can reference that parameter by adding `event.` to the path shown in the debugger, such as `event.nlu.language`.

![NLU Language Emulator](/assets/nlu-emulator.png)

In the Flow Editor, you can access system parameters by bracketing them with two sets of curly brackets.

:::note
The user input language is `{{event.nlu.language}}`.
:::

You can also set variables to be the value of a system parameter as follows:

![NLU Language Set Variable](/assets/nlu-variable.png)

For raw expressions or code (such as in actions), you don't need the curly brackets. Here is an example of a raw expression in a transition:

![NLU Language Raw Expression](/assets/nlu-raw-expression.png)

In the same way, as described above, it's possible to access the values of extracted slots by copying the path from the emulator and prefixing it with `event.` (e.g., `{{state.session.slots.food.value}}`) in the flow builder and `state.session.slots.food.value` in code. `food` is a slot that was set up intent by the chatbot builder.

![Slot Extraction Emulator](/assets/slot-extraction-emulator.png)

As is possible in JavaScript, it is also possible to access the parameters with the following syntax:

`{{state.session.slots["food"].value}}`

## Variables

There are four different kinds of memories in Botpress; the difference between them is the duration and the scope.

- `user` memory is kept forever for the user it is associated with.
- `session` memory is kept for the duration of the configured session.
- `temp` memory is only kept for the duration of the flow.
- `bot` memory is the same value for all users of the same chatbot.

## Common Use Case

Most of the time, you will rely on the `user` and `temp` type of memory. The `temp` memory is only alive for the duration of a flow.

## Setting and Accessing Variables

Variables can be set up or declared using the **Set Variable** action (see the [Dialog Memory](#dialog-memory) section below) or code. When using the **Set Variable** action dialog, the variable is set up and assigned a value.

:::note
In code, the variable is declared simply by using it.
:::

As with system parameters (see [System Parameters](#system-parameter) section), variables can be accessed in the flow builder and the **Set Variable** dialog by bracketing the variables with double curly brackets (such as `{{temp.user_name}}`). 

:::note
In code or raw expressions, the reference to the variable would not need the double curly brackets.
:::

For example, your chatbot would reference the variable as:

`temp.user_name`

### Bot Memory

The `bot` memory is the same value for all users of the chatbot. Think of it as a global variable but scoped to this chatbot only.

## How to Change What's in the Memory?

The most straightforward way is to use the action `base.setVariable`. You only have to specify the type of memory, the variable's name, and what value your chatbot should set it to.

Another common use is with actions. Actions allow you to edit these variables directly. For example, you could write `user.firstname = 'potato'` in your code file to update the user's name.