---
id: version-11.8.1-nlu
title: NLU
original_id: nlu
---

## How it works

The Botpress NLU module will process every incoming messages and will perform Intent Classification, Language Identification, Entity Extraction and Slot Tagging. The structure data that these tasks provide is added to the message metadata directly (under `event.nlu`), ready to be consumed by the other modules and components.

> **QnA**: A simple use-case for bots is to understand a question and to provide an answer automatically. Doing that manually for all the questions and answers using the NLU module and the flow editor would be a tedious task, which is why we recommend using the QnA module for that instead.

## Intent Classification

Intent classification helps you detect the intent of the users. It is a better and more accurate way to understand what the user is trying to say than using keywords.

##### Examples

|              User said              |       Intent       | Confidence |
| :---------------------------------: | :----------------: | :--------: |
| _"I want to fly to Dubai tomorrow"_ |   search_flight    |    0.98    |
|   _"My flight is delayed, help!"_   | faq_flight_delayed |    0.82    |
|    _"Can I bring a pet aboard?"_    |      faq_pet       |    0.85    |

### Adding an intent

To create a new intent, navigate to the NLU module then click "**Create new intent**". Give it a friendly name, then hit OK. You should now add "utterances" of that intent – that is, add as many ways of expressing that intent as possible.

##### Flight Booking Example

```yaml
- book flight
- i want to book a flight
- i want to fly to new york tomorrow
- show me travel options from montreal to tokyo
# provide as many as you can
```

### Responding to an intent

You may detect and reply to intents by looking up the `event.nlu.intent.name` variable in your hooks, flow transitions or actions.

Here's an example of the structure of an incoming event processed by Botpress Native NLU.

```js
{
  "type": "text",
  "channel": "web",
  "direction": "incoming",
  "payload": {
    "type": "text",
    "text": "hey"
  },
  "target": "AwIiKCRH4gH2GBJgQZd7q",
  "botId": "my-new-bot",
  "threadId": "5",
  "id": 1.5420658919105e+17,
  "preview": "hey",
  "flags": {},
  "nlu": { // <<<<------
    "language": "en", // language identified
    "intent": { // most likely intent, assuming confidence is within config treshold
      "name": "hello",
      "confidence": 1
    },
    "intents": [ // all the intents detected, sorted by probabilities
      {
        "name": "hello",
        "confidence": 1,
        "provider": "native"
      },
      {
        "name": "none",
        "confidence": 1.94931e-8,
        "provider": "native"
      }
    ],
    "entities": [], // extracted entities
    "slots" : {} // extracted slots
  }
}
```

You can use that metadata in your flows to create transitions when a specific intent is understood inside a specific flow. You can learn more about flows and transitions [here](./dialogs).

##### Example

![Flow NLU Transition](assets/flow-nlu-transition.jpg)

### Confidence and debugging

To enable debugging of the NLU module, make sure that `debugModeEnabled` is set to `true` in your `data/global/config/nlu.json` file.

> **Tip**: In production, you can also use the `BP_NLU_DEBUGMODEENABLED` environement variable instead of modifying the configuration directly.

##### Example of debugging message

NLU Extraction

```js
{ text: 'they there bud',
  intent: 'hello',
  confidence: 0.966797,
  bot_min_confidence: 0.3,
  bot_max_confidence: 100,
  is_confident_enough: true,
  language: 'en',
  entities: []
}
```

## Entity Extraction

Entity Extraction helps you extract and normalize known entities from phrases.

Attached to NLU extraction, you will find an entities property which is an array of [System](#system-entities) and [Custom](#custom-entities) entities.

#### Using entities

You may access and use data by looking up the `event.nlu.entities` variable in your hooks, flow transitions or actions.

##### Example of extracted entity:

User said : `Let's go for a five miles run`

```js
{
  /* ... other event nlu properties ... */
  entities: [
    {
      type: 'distance',
      meta: {
        confidence: 1
        provider: 'native',
        source: 'five miles', // text from which the entity was extracted
        start: 15, // beginning character index in the input
        end: 25, // end character index in the input
      },
      data: {
        value : 5,
        unit: 'mile',
        extras: {}
      }
    },
    {
      type: 'numeral',
      meta: {
        confidence: 1
        provider: 'native',
        source: 'five', // text from which the entity was extracted
        start: 15, // beginning character index in the input
        end: 19, // end character index in the input
      },
      data: {
        value : 5,
        extras: {}
      }
    }
  ]
}
```

**Note**: In some cases you will find additional structured information in the extras object

### System Entities

#### Duckling extraction

Botpress Native NLU offers a handful of system entity extraction thanks to [Facebook/Duckling](https://github.com/facebook/duckling) for known entity extraction like Time, Ordinals, Date, etc. For a complete list of system entities, please head to [Duckling documentation](https://github.com/facebook/duckling).

At the moment, Duckling is hosted on our remote servers. If you don't want your data to be sent to our servers, you can either disable this feature by setting `ducklingEnabled` to `false` or host your own duckling server and change the `ducklingURL` to the `data/global/config/nlu.json` config file.

For instructions on how to host your own Duckling server, please check the section [Hosting & Environment](../advanced/hosting)

##### Example

|             User said             |    Type    | Value |  Unit   |
| :-------------------------------: | :--------: | :---: | :-----: |
| _"Add 5 lbs of sugar to my cart"_ | "quantity" |   5   | "pound" |

```js
{
  type: 'quantity',
  meta: {
    confidence: 1,
    provider: 'native',
    source: '5 lbs', // text from which the entity was extracted
    start: 4, // beginning character index in original input
    end: 9, // end character index in original input
  },
  data: {
    value : 5,
    unit: 'pound',
    extras: {}
  }
}
```

**Note**: Confidence will always be 1 due to the rule based implementation of Duckling

#### Placeholder extraction (experimental)

Botpress Native NLU also ships a system entity of type `any` which is essentially a placeholder. This feature is working but requires a lot of training data. Before identifying slots [see slots docs](#slots) as entity type `any`, try to use custom entities.

An example of placeholder entity would be : Please tell **Sarah** that **she's late**

### Custom Entities

As of today we provide 2 types of custom entites: [pattern](#pattern-extraction) and [list](#list-extraction) entitites. To define a custom entity, head to the **Entity section** of the Understanding Module in your botpress studio side bar. From there you'll be able to define your custom entities that will be available for any input message treated by your chatbot. Go ahead and click on **create new entity**

<img src="/docs/assets/nlu-create-entity.png">

### Sensitive Informations

Communication between users and bots are stored in the database, which means that sometimes personal informations (eg: credit card) may be persisted as well. To avoid that problem, it is possible to tell Botpress that certain entities are not to be persisted. When creating or editing an Entity, there is a small checkbox located in the upper right corner labeled `sensitive`.

When checked, the information will still be displayed in the chat window, but the sensitive information will be replaced by `*****` before being stored. The original value is still available from `event.nlu.entities`

#### Pattern extraction

Once you've created a pattern entity, Botpress Native NLU will perform a regex extraction on each incomming message and add it to `event.nlu.entities`.

##### Example :

Given a Pattern Entity definition with `[A-Z]{3}-[0-9]{4}-[A-Z]{3}` as pattern:

![create slot](assets/nlu-pattern-entity.png)

Extraction will go like:

|           User said           | Type  |     Value      |
| :---------------------------: | :---: | :------------: |
| _"Find product BHZ-1234-UYT"_ | "SKU" | "BHZ-1234-UYT" |

```js
{ name: 'SKU',
  type: 'pattern',
  meta:
   { confidence: 1,
     provider: 'native',
     source: 'BHZ-1234-UYT',
     start: 13,
     end: 25,
     raw: {} },
  data: {
    extras: {},
    value: 'BHZ-1234-UYT',
    unit: 'string'
    }
}
```

#### List extraction

List extraction will behave in a similar way. The major addition is that for your entity definition, you'll be able to add different **occurences** of your entity with corresponding synonyms.

Let's take **Airport Codes** as an example:

![create slot](assets/nlu-list-entity.png)

Extraction will go like:

|              User said               |      Type       |     Value      |
| :----------------------------------: | :-------------: | :------------: |
| _"Find a flight from SFO to Mumbai"_ | "Airport Codes" | ["SFO", "BOM"] |

```js
;[
  {
    name: 'Airport Codes',
    type: 'list',
    meta: {
      confidence: 1,
      provider: 'native',
      source: 'SFO',
      start: 19,
      end: 22,
      raw: {}
    },
    data: {
      extras: {},
      value: 'SFO',
      unit: 'string'
    }
  },
  {
    name: 'Airport Codes',
    type: 'list',
    meta: {
      confidence: 1,
      provider: 'native',
      source: 'Mumbai',
      start: 26,
      end: 32,
      raw: {}
    },
    data: {
      extras: {},
      value: 'BOM',
      unit: 'string'
    }
  }
]
```

## Slots

Slots are another major concept in Botpress NLU. You can think of them as necessary **parameters** to complete the action associated to an intent.

### Slot Tagging

Botpress Native NLU will tag each _words_ (tokens) of user input. If it's correctly identified as an intent slot it will be attached to NLU extraction event. Each identified slot will be accessible in the `event.nlu.slots` map using its name as key.

To define a slot for a particular intent, head to the **Intent section** of the Understanding Module in your Botpress Studio side bar. From there select the intent you want to add slots to, then you'll be able to define your slots. Go ahead and click on **create a slot**

![create slot](assets/nlu-create-slot.png)

Let's use a `find_flight` intent. In order to book a flight, we'll define 2 slots: `airport_from` and `airport_to` both associated with the `Airport Codes` custom list entity. Once that is done, we need to identify every airport slots.

![tag slots](assets/nlu-tag-slot.png)

#### Example

User said : `I would like to go to SFO from Mumbai`

`event.nlu.slots` will look like

```js
slots : {
  airport_to: {
    name: 'airport_to',
    value: 'SFO', // shorthand for entity.data.value
    entity: [Object] //detailed extracted entity
  },
  airport_from: {
    name: 'airport_from',
    value: 'BOM',  // shorthand for entity.data.value
    entity: [Object] //detailed extracted entity
  }
}
```

### Slot Filling

As of now when you define an intent slot, it is considered as optional. If it's mandatory for a desired task, you'll have to handle slot filling yourself in your conversational flow design using [Botpress Flow Builder](./dialogs). We plan to add suppport for **required slots** with automatic slot filling.

**TODO provide example**

## External NLU Providers

Botpress NLU ships with a native NLU engine (Botpress Native NLU). The advantage of using Botpress NLU is that it is fast (both at training and evaluation time), secured (doesn't hit the cloud), predictable (you can write unit tests, the model resides on your computer) and free.

If for some reason you want to use an external provider, you can do so by using [Hooks](./code#hooks) and calling the external NLU provider via API.

> **Note**: External providers don't work with the Botpress NLU graphical interface. We have dropped support [see why](https://github.com/botpress/botpress/pull/1170) for two-way synchronization as there were too many issues in doing (and maintaining) that.

### Example

You can enable **Recast AI** by removing the `.` prefix to the `hooks/before_incoming_middleware/.05_recast_nlu.js` file.

> Feel free to contribute to Botpress to add new external NLU providers

##### Features by Providers

|  Provider  | Intent | Entity | Slot tagging | Lang | Context | Sentiment |
| :--------: | :----: | :----: | :----------: | :--: | :-----: | :-------: |
|   Native   |   X    |   X    |      X       |  X   |    X    |           |
| DialogFlow |   X    |   X    |      X       |      |    X    |           |
|    Luis    |   X    |   X    |              |      |         |     X     |
|   Recast   |   X    |   X    |              |  X   |         |     X     |
|    Rasa    |   X    |   X    |              |      |         |           |
