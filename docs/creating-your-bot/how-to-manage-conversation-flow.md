# How to manage conversation flow

## Other techniques

Botpress has many ways to handle conversation flows. 

- **Built-in Flow Manager** (recommended, see below)
- The [**RiveScript**](https://github.com/botpress/botpress-rivescript) module is a very powerful scripting language for chatbots
- For those familiar with Botkit, there's a [botpress-botkit](https://github.com/botpress/botpress-botkit) module (**deprecated**, see our Built-in Flow Manager below)
- [API.AI](https://github.com/botpress/botpress-api.ai)
- [wit-ai](https://github.com/botpress/botpress-wit)


## Built-in Flow Manager (`bp.convo`)

#### `bp.convo.create(event)` -> convo

Creates and starts a conversation immediately. To create a conversation, an initial `event` is required. The event is most often taken from a `bp.hear` (see example below).

#### `bp.convo.start(event, [callback])` -> convo

Same as `create` except that it also `activate()` the convo automatically.

An optionnal `callback` can be provided to configure the conversation before it actually starts.

#### `bp.convo.find(event)` -> convo || null

Tries to find an active conversation matching the event. See example below.

#### Conversation | `convo.threads`

`convo.threads` is a ready-only map containing all the threads in the conversation. You can get a thread using `convo.threads[name]`.

#### Conversation | `convo.set(name, value)`

Sets a variable in the conversation. This is meant to store temporarily conversation state.

**Note: this is currently NOT persisted anywhere and is synchronous.** You should use the built-in Botpress database to store anything important of that needs to be long-lived.

#### Conversation | `convo.get(name)` -> value

Gets a variable in the conversation.

#### Conversation | `convo.say(MessageObject)`

Queues a message for sending.

**Note: messages are sent in the order they have been queued**

#### Conversation | `convo.repeat()`

Repeats the last message or question sent by the current thread

#### Conversation | `convo.next()`

Continue the execution of the current thread

#### Conversation | `convo.switchTo(threadName)`

Switches to the thread named `threadName`. Upon switching to a new thread, `next()` is automatically called (meaning any message / questions queued will be sent).
