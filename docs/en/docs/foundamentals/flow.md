---
layout: guide
---

## The Different Techniques <a class="toc" id="toc-the-different-techniques" href="#toc-the-different-techniques"></a>


**This document is about the build-in Flow Manager (Convo)**, but there are many other ways of creating a conversational flow. Most of the time, these techniques can even be combined:

- **Built-in Flow Manager** (recommended, see below)
- The [**RiveScript**](https://github.com/botpress/botpress-rivescript) module is a scripting language for chatbots
- [API.AI](https://github.com/botpress/botpress-api.ai)
- [wit-ai](https://github.com/botpress/botpress-wit)

> **DO NOT CONFUSE:** Both API.AI and Wit.ai are listed there not because of their NLP capabilities but because of their respective Flow Management systems (which are complementary to the NLP).

## Built-in Flow Manager (`bp.convo`) <a class="toc" id="toc-built-in-flow-manager-bp-convo" href="#toc-built-in-flow-manager-bp-convo"></a>


**`convo`** ships with Botpress and does not need to be installed. It is available through the global `bp` instance.

### API Reference <a class="toc" id="toc-api-reference" href="#toc-api-reference"></a>

#### `bp.convo.create(event)` -> convo <a class="toc" id="toc-bp-convo-create-event-convo" href="#toc-bp-convo-create-event-convo"></a>

Creates a conversation but the conversation is not activated. You need to call `activate()` to start the conversation. To create a conversation, an initial `event` is required. The event is most often taken from a `bp.hear` (see example below).

##### Usage <a class="toc" id="toc-usage" href="#toc-usage"></a>

```js
bp.hear('hello', (event, next) => {
  const convo = bp.convo.create(event)
})
```

#### `bp.convo.start(event, [callback])` -> convo

Same as `create` except that it also `activate()` the convo automatically.

An optionnal (although recommended) `callback` can be provided to configure the conversation before it actually starts.

##### Usage <a class="toc" id="toc-bp-convo-start-event-callback-convo" href="#toc-bp-convo-start-event-callback-convo"></a>

```js
bp.hear('hello', (event, next) => {
  bp.convo.start(event, convo => {
    // configure the convo here  
  })
})
```

#### `bp.convo.find(event)` -> convo || null

Tries to find an active conversation matching the event. See example below.

##### Usage

```js
bp.hear('hello', (event, next) => {
  if (bp.convo.find(event)) {
    // There's already a convo for this user
    return
  }

  const convo = bp.convo.create(event)
})
```

#### Conversation | `convo.threads`

`convo.threads` is a read-only map containing all the threads in the conversation. You can get a thread using `convo.threads[name]`.

##### Usage

```js
bp.hear('hello', (event, next) => {
  bp.convo.start(event, convo => {
    const defaultThread = convo.threads['default']
  })
})
```

#### Conversation | `convo.set(name, value)`

Sets a variable in the conversation. This is meant to store temporary conversation state.

**Note: this is currently NOT persisted anywhere and is synchronous.** You should use the built-in Botpress database to store anything important or that needs to be long-lived.

##### Usage

```js
bp.convo.start(event, convo => {
  convo.set('name', event.user.first_name)
})
```

#### Conversation | `convo.get(name)` -> value

Gets a variable in the conversation.

##### Usage

```js
bp.convo.start(event, convo => {
  const name = convo.get('name')
})
```

#### Conversation | `convo.say(MessageObject)`

Queues a message for sending.

> **Note: messages are sent in the order they have been queued**

#### Conversation | `convo.say(bloc, [data])`

Queues a [UMM bloc](./../umm) for sending. Optionally, you can pass data to the UMM engine.

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

> **TIP**: If you want to capture button clicks (postback) or quick replies, you should set `convo.messageTypes = ['postback', 'quick_reply', 'message', 'text']`

#### Thread | `thread.addMessage(MessageObject)`

#### Thread | `thread.addMessage(bloc, [data])`

##### Examples

**No data**

```js
bp.convo.start(event, convo => {
  convo.threads['default'].addMessage('#welcome')
})
```

**Data as object**

```js
bp.convo.start(event, convo => {
  convo.threads['default'].addMessage('#welcome', { key: 'value' })
})
```

**Deferred Data (synchronous)**

```js
bp.convo.start(event, convo => {
  convo.threads['default'].addMessage('#sayLast', () => {
    return { last: convo.get('last') }
  })
})
```

**Deferred Data (async with Promises)**

```js
bp.convo.start(event, convo => {
  convo.threads['default'].addMessage('#sayLast', () => {
    // You can return promises
    return Promise.delay(1000).then(() => {
      return { last: convo.get('last') }  
    })
  })
})
```

#### Thread | `thread.addQuestion(MessageObject, callback || Array<handler>)`

#### Thread | `thread.addQuestion(bloc, [data], callback || Array<handler>)`

##### Usage

```js
bp.convo.start(event, convo => {
  // No data provided, handling response with single callback
  convo.threads['default'].addQuestion('#askAge', response => {
    const parseAge = /I am (\d+) years old/i
    if (!parseAge.test(response.text)) {
      convo.repeat() // Repeat the last question (#askAge)
    }
    // ...
  })
})
```

```js
bp.convo.start(event, convo => {
  // No data provided, handling response with single callback
  convo.threads['default'].addQuestion('#askAge', [
    { 
      pattern: /I am (\d+) years old/i ,
      callback: (response) => {
        const age = response.match
        // do something with age
      }
    },
    {
      default: true,
      callback: (response) => {
        convo.repeat() // Repeat the last question (#askAge)
      }
    }
  ])
})
```

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
