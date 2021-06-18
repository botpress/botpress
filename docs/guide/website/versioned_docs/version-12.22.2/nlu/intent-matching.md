---
id: version-12.22.2-intent-matching
title: Intent Classification
original_id: intent-matching
---

Intent classification helps your chatbot recognize the meaning of a user's message. It is a better, more accurate way to understand what the user is trying to say than using keywords. This is possible because you can program your chatbot to extract this from a natural conversation.

An intent is created with various utterances. These are the different ways of putting across a question or intention. For example, the following are different statements which someone can say to book a flight: 
 - Book flight
 - I want to search for a flight
 - I want to fly to New York tomorrow
 - Show me travel options from Montreal to Tokyo

By adding these different ways of saying the same thing, the chatbot can train on the concept of that intent and not just specific words. The user input is compared with all the given intents and matched with the most appropriate, that is, the intent with the highest confidence level.

|              User said              |    Intent Matched  | Confidence |
| :---------------------------------: | :----------------: | :--------: |
| _"I want to fly to Dubai tomorrow"_ |   search_flight    |    0.98    |
|   _"My flight is delayed, help!"_   | faq_flight_delayed |    0.82    |
|    _"Can I bring a pet aboard?"_    |      faq_pet       |    0.85    |

## Usage
Intents should be used in instances when information needs to be extracted from the user input. They are also handy when a workflow needs to start.


## Adding an intent
To create a new intent, navigate to the NLU module, then click "**Create new intent**". Please give it a friendly name, then hit OK. You should now add "utterances" of that intent – that is, add as many ways of expressing that intent as possible. Intent detection works best when you add between ten and twenty utterances.
![Adding an intent](../assets/intent-creation.png)
**Punctuation** is ignored in general for text classification, except for hyphens. Punctuation is taken into account for entities and slots only.

**Hyphens** hyphenated words are joined as a single token (word).

**Case sensitivity**: all text is converted to lowercase for intent matching


|  User said                              |   Will be converted to                  |
|  :------------------------------------: | :------------------------------------:  |
|  Hi! What can you do?                   |   hi what can you do                    |
|  Do you have any Chicago-based offices? |   do you have any chicago-based offices |

## Responding to an intent

You may detect and reply to intents by looking up the `event.nlu.intent.name` variable in your hooks, flow transitions, or actions.

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

You can use that metadata in your flows to create transitions when a specific intent is detected inside a particular flow. You can learn more about flows and transitions [here](../main/dialog). Y


![Flow NLU Transition](../assets/flow-nlu-transition.jpg)

## Confidence and debugging

To enable debugging of the NLU module, ensure that `debugModeEnabled` is set to `true` in your `data/global/config/nlu.json` file.

> **Tip**: In production, you can also use the `BP_NLU_DEBUGMODEENABLED` environment variable instead of modifying the configuration directly.

### Example of debugging message

NLU Extraction

```js
{ text: 'hey there bud',
  intent: 'hello',
  confidence: 0.966797,
  bot_min_confidence: 0.5,
  bot_max_confidence: 100,
  is_confident_enough: true,
  language: 'en',
  entities: []
}
```
## Acting On An Intent

### Method 1: Switch Case

Let's start by creating intents. We will create three intents, namely, `book-flight`, `cancel-flight` and `get-prices`.

![](../assets/intent-matching-switch-intents.png)

We can tell our chatbot to go to a particular node based on these intents by creating a transition. Click on the `Intent Is` radio button and select the intent of your choice. We will leave `When the condition is met` empty for now because we will manually link the nodes later on.

![](../assets/intent-matching-transition.png)

After adding transition, the entry node now looks like the screenshot below. For some use-cases, it is worthy to note that transitions are executed in sequence. Therefore, when a phrase covers more than one intent, be careful which one you would like to be processed first.

![](../assets/intent-matching-node.png)

To test whether the intents are being detected correctly, let's link a node to each transition. We will add some text to these nodes, which will confirm our intention. Please make sure that you train the chatbot using the `train chatbot` button in the bottom right corner of the studio interface before testing your chatbot.

![](../assets/intent-matching-switch-case.png)

Now when we test our chatbot, we will get the expected result. This powerful feature allows you to act on any anticipated user interaction you have created intent for. To get more accurate results, add at least ten training phrases to each intent.

![](../assets/intent-matching-switch-conversation.png)

### Method 2: QNA

This method is the easiest way to act on an intent. We didn't showcase it first because QNA uses something very similar to the Switch Case Method in the background.

Let's remove all transitions from our flow. QNA will "jump" to the flow/node of your choice.

![](assets/intent-matching-qna-flow.png)

In the QNA interface, we will create flight booking questions. Instead of providing an answer to the QnA, we will redirect the user to a specific node when a particular intent is detected.

let's go to Paris
I want to travel to Montreal from the USA
I want to go from Quebec to NYC
I want to book a flight to Tokyo from Namib
Book a flight to London from Paris
I need to fly from Accra to Barcelona
Are there any flights to Florida
I need a flight from Toronto to Ottawa
Is there a flight from Boston to Los Angeles

![](assets/intent-matching-qna-new.png)

Testing the chatbot using our new QnA demonstrates how this method works. When a QnA is detected with a high confidence threshold, it's elected, and the user is redirected to the node specified in the QnA.

![](assets/intent-matching-qna-conversation.png)

> This method is not considered best practice, but it does the job for quick demonstrations. However, we recommend using the first method if you have basic intents without any slots.

### Method 3: Combining Switch Case and Slot Skill

The Slot Skill can be used in collaboration with the "Switch Case Method" when intent has one or more slots. For this example, let us add a `destination` slot 'to the `book-flight` intent. You can learn more about adding slots in the [entities](entities) topic 

![](../assets/intent-matching-slot-intents.png)

After that, we will create a new Slot Skill and select the `destination` slot.

![](../assets/intent-matching-slot-skill.png)

We can now edit our confirmation message so that it confirms the actual destination.

![](../assets/intent-matching-slot-text.png)

The flow now looks like this:

![](../assets/intent-matching-slot-flow.png)

When we test the conversation, we can see that the bot will confirm the flight booking destination.

![](../assets/intent-matching-slot-conversation.png)

> **Note**: The Slot Skill uses implicit intent matching in the background. So it's not required to have a transition to a Slot Skill. 
