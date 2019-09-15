---
id: version-11.0.1-nlu
title: NLU
original_id: nlu
---

## How it works

The Botpress NLU module will process every incoming messages and will perform Intent Classification, Entity Extraction and Language Identification. The structure data that these tasks provide is added to the message metadata directly (under `event.nlu`), ready to be consumed by the other modules and components.

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
    "entities": [] // extracted entities
  }
}
```

You can use that metadata in your flows to create transitions when a specific intent is understood inside a specific flow. You can learn more about flows and transitions [here](/docs/build/dialogs).

##### Example

![Flow NLU Transition](assets/flow-nlu-transition.jpg)

### Confidence and debugging

To enable debugging of the NLU module, make sure that `debugModeEnabled` is set to `true` in your `data/global/config/nlu.json` file.

> **Tip**: In production, you can also use the `BP_NLU_DEBUGMODEENABLED` environement variable instead of modifying the configuration directly.

##### Example of debugging message

```sh
NLU Extraction { text: 'they there bud',
              intent: 'hello',
              confidence: 0.966797,
              bot_min_confidence: 0.3,
              bot_max_confidence: 100,
              is_confident_enough: true,
              language: 'en',
              entities: [] }
```

## Entity Extraction

Entity Extraction helps you extract and normalize known entities from phrases.

##### Example

|              User said              | City  |    Date     |
| :---------------------------------: | :---: | :---------: |
| _"I want to fly to Dubai tomorrow"_ | Dubai | 01 Jan 2018 |

**TODO**: Documentation on how to configure entity extraction missing

## Providers

Botpress NLU ships with a native NLU engine (Botpress Native NLU) which doesn't have any external dependencies and doesn't hit the cloud. If, for some reason, you want to switch the NLU engine that Botpress will use to extract the information, you can do so by changing the NLU configuration file `data/global/config/nlu.json`.

##### Features by Providers

|  Provider  | Intent | Entity | Lang | Context |
| :--------: | :----: | :----: | :--: | :-----: |
|   Native   |   X    |        |  X   |         |
|    RASA    |   X    |   X    |      |         |
| DialogFlow |   X    |   X    |      |    X    |
|    LUIS    |   X    |   X    |      |         |
