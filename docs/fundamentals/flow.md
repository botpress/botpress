# Managing the conversation Flow

## The Different Techniques

Botpress has many ways to handle conversation flows:

- **Built-in Flow Manager** (recommended, see below)
- The [**RiveScript**](https://github.com/botpress/botpress-rivescript) module is a scripting language for chatbots
- [API.AI](https://github.com/botpress/botpress-api.ai)
- [wit-ai](https://github.com/botpress/botpress-wit)

**This document is about the build-in Flow Manager (Convo)**

## Built-in Flow Manager (`bp.convo`)

**`convo`** ships with Botpress and does not need to be installed. It is available through the global `bp` instance.

### API Reference

#### `bp.convo.create(event)` -> convo

Creates a conversation but the conversation is not activated. You need to call `activate()` to start the conversation. To create a conversation, an initial `event` is required. The event is most often taken from a `bp.hear` (see example below).

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

#### Conversation | `convo.stop([string_reason])`

Stops the conversation, meaning it stop processing incoming messages and will eventually be garbage collected.

Emits the `stop` event

An optional `reason` can be given, which is passed to the `stop` event and is also self-emitted. (see example below with `aborted`)

#### Conversation | `convo.messageTypes` -> []

Get or set the types of messages that will be treated as a `question` answer.

For example, `convo.messageTypes = ['postback']` will make the conversation listen only for Messenger Postbacks

Defaults to: `['text', 'message']`

#### Thread | `thread.addMessage(MessageObject)`

#### Thread | `thread.addQuestion(MessageObject, handlers)`

### Full example

```js
const _ = require('lodash')

module.exports = function(bp) {

  bp.middlewares.load()

  const utterances = {
    good: /good|great|fine|ok|excellent|fantastic/i,
    bad: /bad|sad|not good|not great|bof/i,
    stop: /stop|cancel|abort/i
  }

  const variants = {
    feeling_good: () => _.sample(['Glad to hear that!', 'Fantastic!', 'Yay!']),
    feeling_bad: () => _.sample(['So sorry to hear that', ':('])
  }

  bp.hear(utterances.stop, (event, next) => {
    const convo = bp.convo.find(event)
    convo && convo.stop('aborted')
  })

  bp.hear(/hello/i, (event, next) => {
    
    const txt = txt => bp.messenger.createText(event.user.id, txt)

    bp.convo.start(event, convo => {

      convo.threads['default'].addMessage(txt('Hello! This is an example of conversation'))
      convo.threads['default'].addQuestion(txt('How are you?'), [
        { 
          pattern: utterances.good,
          callback: () => {
            convo.set('feeling', 'good')
            convo.say(txt(variants.feeling_good()))
            convo.switchTo('age')
          }
        },
        { 
          pattern: utterances.bad,
          callback: () => {
            convo.set('feeling', 'bad')
            convo.say(txt(variants.feeling_bad()))
            convo.say(txt('Anyway..!'))
            convo.switchTo('age')
          }
        },
        {
          default: true,
          callback: () => {
            // Example of sending a custom message other than text
            const imageMessage = bp.messenger.createAttachment(event.user.id, 'image', 'https://s3.amazonaws.com/botpress-io/images/grey_bg_primary.png')
            convo.say(imageMessage)

            // Order of messages are preserved, i.e. this message will show up after the image has been sent
            convo.say(txt('Sorry I dont understand'))

            // Repeats the last question / message
            convo.repeat()
          }
        }
      ])

      convo.createThread('age')
      convo.threads['age'].addQuestion(txt('What is your age sir?'), [
        {
          pattern: /(\d+)/i,
          callback: (response) => { // Using the response event
            convo.set('age', response.match) // Captured group is stored in event
            convo.say(txt('Got your age. ' + response.match + ' is pretty old!'))
            convo.next()
          }
        },
        {
          default: true,
          callback: () => {
            convo.say(txt('Hrm.. Im expecting a number!'))
            convo.repeat()
          }
        }
      ])

      convo.on('done', () => {
        convo.say(txt(`So... you are feeling ${convo.get('feeling')} and you are ${convo.get('age')} years old.`))
        convo.say(txt('This conversation is over now.'))
      })

      convo.on('aborted', () => {
        convo.say(txt('You aborted this conversation. Bye!'))
      })

    })

  })
}
```
