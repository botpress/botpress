---
id: intents
title: Intents
---

--------------------

Recognizing the meaning of user messages is essential. Not only identifying them but accurately classifying them is also critical. To do so, you can program your chatbot to extract information from a natural conversation (a conversation with a human).

When you create an intent, you also create various utterances. Utterances represent the different statements your user can use for the same intention.

**Example - Ordering a coffee:**

 - I want coffee
 - I'd like some coffee, please
 - Do you have a decaf espresso?
 - Hi. I'd like to order a latte, please. Normal, single shot.

You can add these different utterances to train your chatbot to answer an intent instead of a specific word. The user statements are compared and matched with the most appropriate intent, with the highest confidence percentage.

|                     User Message                  |   Intent Matched   | Confidence |
| :-----------------------------------------------: | :----------------: | :--------: |
| "_An espresso, please_"                           |     place-order    |    0.97    |
| "_I would like to order a coffee._"               |     place-order    |    0.91    |
| "_Can you please give me a double cappuccino?_"   |     place-order    |    0.96    |

## Adding an Intent

To create a new intent,

1. In your Conversation Studio, click the NLU module on the right sidebar.
2. Click the **+** button.
3. Give it a friendly name.
4. Click **Submit**.
5. Write your utterances next to the number (where you can see **Type a sentence**).

Don't forget that:

- **Punctuation** is ignored for text classification, except for hyphens.
- **Hyphens** between words are joined as a single word.
- **Case sensitivity** is ignored, which means that all text is converted to lowercase.

**Examples:**

|  User message                                                   |  Is converted to                                                 |
|  :------------------------------------------------------------: | :--------------------------------------------------------------: |
|  Hi! Could you please give me a single shot of coffee? Thanks!  |   hi could you please give me a single shot of coffee thanks     |
|  Do you have any cappuccino available?                          |   do you have any cappuccino available                           |

## Responding to an Intent

You can detect and reply to intents by analyzing the `event.nlu.intent.name` variable in your hooks, flow transitions, or actions.

**Example:**

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
    "intent": { // most likely intent, assuming confidence is within config threshold
      "name": "hello",
      "context": "global",
      "confidence": 1
    },
    "intents": [ // all the intents detected, sorted by probabilities
      {
        "name": "hello",
        "context": "global",
        "confidence": 1
      },
      {
        "name": "none",
        "context": "global"
        "confidence": 1.94931e-8
      }
    ],
    "entities": [], // extracted entities
    "slots" : {} // extracted slots
  }
}
```

:::note
You can use that metadata to create transitions when a specific intent is detected inside a particular flow. You can learn more about flows and transitions.
:::

## Confidence and Debugging

To enable debugging, ensure that `debugModeEnabled` is set to `true` in your `data/global/config/nlu.json` file.

:::tip
In a production environment, you can also use the `BP_NLU_DEBUGMODEENABLED` variable instead of modifying the configuration directly.
:::

**Example:**

NLU Extraction

```js
{ text: 'hey there bud',
  intent: 'hello',
  confidence: 0.966797,
  bot_min_confidence: 0.5,
  bot_max_confidence: 100,
  is_confident_enough: true,
  language: 'en',
  entities: [ ]
}
```