---
id: slot-filling
title: Slot Filling
---

--------------------

Slots are a significant concept in Botpress NLU. You can think of them as necessary **parameters** to complete the action associated with an intent.

## Slot Tagging

Botpress Native NLU will tag each _word_ (token) of user input. Words separated by a hyphen are treated as one token. If the token is correctly identified as a slot, it will be attached to the NLU extraction event. Each identified slot will be accessible in the `event.nlu.slots` object using its name as the key.

### Defining Slots

To define a slot for a particular intent:

1. Click the **NLU** tab.
1. Open the **Intent Section**. 
1. Select the intent you want to add slots to, then you'll be able to define your slots.
1. Click on **Create a Slot**.

![create slot](/assets/nlu-create-slot.png)

Let's use a `book_flight` intent. To book a flight, we'll define two slots: `departure` and `destination`, both associated with the `Airport Codes` custom list entity. Once that is done, we need to identify every airport slot.

![tag slots](/assets/nlu-tag-slot.png)

### Example

The user said: `I would like to go to SFO from Mumbai.`

`event.nlu.slots` will look like:

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

## Slot Filling

Slot filling is the process of gathering information required by an intent. This information is defined as _slots_ as we mentioned in the above section.  It handles input validation and the chatbot's reply when the input is invalid. Botpress has an in-built skill to handle the slot filling process.

### Creating a Slot Skill

We will use the slots which we defined earlier in this tutorial.

1. In the Flow Editor view, click on **Insert skill** > **Slot**.
2. Choose an intent to use for the slot filling.
3. Choose a slot to fill.
4. Choose the content that your chatbot will ask. It should be a question about the information you seek, such as "From where are you departing?" or "Where do you want to go?" etc.
5. Choose the content for your chatbot reply when the input is invalid. It should guide the user towards a valid answer.

![Skill Slot Overview](/assets/slot-skill-overview.png)

### Validation Types

There are two types of validations:

1. **Input validation**: The first validation is based on entity extraction. If the provided information doesn't match the entity of the slot, the chatbot will notify the user. This will not apply when the slot has the type `@system.any`. In this case, the chatbot will ultimately provide the complete user phrase when it fails to match a slot confidently.
2. **Custom Input Validation**: you can use an action to add custom validation, such as regex or type validation (number, string). The action should set the variable `temp.valid` to either `true` or `false` based on the validation result.

### Max retry attempts

How many times the chatbot should try to get the correct answer. `On not found` outcome will be triggered when the maximum is reached.

### Outcomes

Three outcomes are possible:

1. `On extracted` - The slot has been successfully extracted. It will be stored in `session.slots.<slot_name>`.
2. `On not found` - The slot has not been extracted. This will also happen when the maximum number of retries is reached or when custom validation fails.
3. `On already extracted` - The slot has previously been extracted. One use-case for that would be to ask the user if the previous information is still relevant or if he would like to overwrite it.

![Slot skill outcomes](/assets/slot-skill-outcomes.png)

## Chaining Multiple Slots

You can chain multiple skills to fill all the slots for a given intent. Chaining skills is handy when all the slots in a given intent are mandatory for a data set to be complete. In the flight booking example, we need the `departure city`, `destination city`, and `time of departure` to check if a flight is available. Since these fields are mandatory, this is a good use case for skill chaining.

![Skill Slot Flow](/assets/slot-skill-flow.png)

This flow will result in a conversation like the one below. Notice that in the first phrase, `I want to book a flight to NYC`, the intent `book-flight` is matched, and NYC has been extracted as the `to` slot. Then, the chatbot tries to fill the remaining slots `from` and `when`.

![Skill Slot Convo](/assets/slot-skill-convo.png)

## Guidelines When Adding Slots

- Mix the positions of the slots in the utterances.

**Example:**

![Mix Slots](/assets/slots-mix.png)

- Avoid duplication when using slots.

**Example - to avoid:**

![Duplicated Slots](/assets/slot-mix.png)

- Limit the number of slots used for a given Intent.

Suggestion: maximum of 3

- Try mixing utterances with the slots to be: filled, partially filled, or empty.

**Example:**

![Filling Slots](/assets/slots-fill-mix.png)

- Examples in utterances should match the defined entity.

**Example:** 
  `Entity list`: Google, Slack, Github, Email
  `Intent`: `Reset Trello password` (Slot value is not part of the list)

- When using slots, there have to be at least five utterances with an example of the slot; the more slots, the more utterances with examples.