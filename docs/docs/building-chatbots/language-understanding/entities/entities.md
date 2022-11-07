---
id: entities
title: Entities
---

--------------------

Entities are intent parameters. They represent a concept such as a colour, a date, a time, or a weight. Entity extraction helps you extract and normalize desired entities if they are present in a user phrase or message to the chatbot. 

:::note
The following example comes from the [Intent Classification](/building-chatbots/language-understanding/intents) page.
:::

**Example:**
The `place-order` intent contains the following entities:
- `caffeine` that specifies if the coffee is caffeinated or decaffeinated.
- `size` for a single or a double shot.
- `drink` that specifies the kind of drink asked.

Attached to NLU extraction, you will find an entities property which is an array of [System](#system-entities) and [Custom](#custom-entities) entities.

## Using Entities

You may access and use entity data by looking up the `event.nlu.entities` variable in your hooks, flow transitions, or actions.

### Example of Extracted Entity:

The user said: `Let's go for five miles run.`

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

:::note
In some cases, you will find additional structured information in the extras object.
:::

## Custom Entities
Botpress provides two types of custom entities: [pattern](#pattern-extraction) and [list](#list-extraction) entities. To define a custom entity, go to the **Entity section** of the NLU Module interface accessible from the Botpress studio sidebar. From there, you can define your custom entities which will be available for any input message treated by your chatbot. Go ahead and click on **create new entity**

## Placeholder Extraction
Botpress Native NLU also has a system entity of type `any`, which is essentially a placeholder. For this feature to work optimally, a lot of training data is required. Before identifying slots [see slots docs](#slots) as entity type `any`, try to use custom entities.

An example of a placeholder entity would be: Please tell **Sarah** that **she's late**

For placeholder extraction, please take note of the points below.
- When using a slot with system.any - Capitalization matters
- The any-type slots try to generalize, without any help from patterns and existing keywords, so they look for:
- The size of the words
- The surrounding words
- Whether the first letter is capital
- Whether all the letters are capital or not
- The presence of punctuation or symbols (like hyphens)
- The meaning of the word VS the other vocabulary
 
Consider that the any-type slot should be used as the last resort and requires at least ten times as much data as any other form of entity extraction via slots. 

## Sensitive Information
Messages sent between users and the chatbot are stored in the database, which means that sometimes your chatbot may save personal information (e.g., a credit card number) as well. To protect the chatbot user's confidential information, use the small checkbox located in the upper right corner labeled `sensitive` when creating such entities.

When checked, your chatbot will still display the information in the chat window, but the sensitive information will be replaced by `*****` before being stored. The original value is still available from `event.nlu.entities`
