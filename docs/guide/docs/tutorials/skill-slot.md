---
id: skill-slot
title: How to use Slot Skill
---

## Overview

The Slot skill is used to help with something that we refer as _slot filling_. It handles input validation and bot reply when the input is invalid.

## Define your slots

Let's say that we have an intent to book a flight. We need the following information:

- From where is the user departing (from)
- Where he is going (to)
- When he is departing (departure)

> For the purpose of this tutorial, both _from_ and _to_ slots are of type `@system.any`. _departure_ is of type `@system.time`.

![Skill Slot Intents](assets/slot-skill-intents.png)

## Create your skill

1. From the Flow Editor view, click on Insert skill > Slot.
1. Choose an intent to use for the slot filling.
1. Choose a slot to fill.
1. Choose the content that your bot will ask. It should be a question about the information you seek e.g. "From where are you departing?", "Where do you want to go?", etc.
1. Choose the content for your bot reply when the input is invalid. It should guide the user towards a valid answer.

![Skill Slot Overview](assets/slot-skill-overview.png)

### Validation Types

There are two types of validations:

1. **Input validation**: The first validation is based on entity extraction. If the provided information doesn't match the entity of the slot, the bot will notify the user. This will not apply when the slot has type `@system.any`.
1. **Custom Input Validation**: An action can be used to add custom validation e.g. regex, type validation (number, string). The action should set the variable `temp.valid` to either true or false based on validation result.

### Max retry attempts

How many times the bot should try to get the right answer. `On not found` outcome will be triggered when the maximum is reached.

## Outcomes

Three outcome are possible:

1. `On extracted` - The slot has been successfuly extracted. It will be stored in `session.extractedSlots.<slot_name>`
1. `On not found` - The slot has not been extracted. This will also happen when the maximum number of retries is reached or when custom validation fail.
1. `On already extracted` - The slot has previously been extracted. One use-case for that would be to ask for the user if the previous information is still relevant and if he would like to overwrite it.

![Slot skill outcomes](assets/slot-skill-outcomes.png)

## Chaining Multiple Slots

You can chain multiple skills to fill all the slots for a given intent:

![Skill Slot Flow](assets/slot-skill-flow.png)

This flow will result in something like this:

![Skill Slot Convo](assets/slot-skill-convo.png)

Notice that in the first phrase "I want to book a flight to NYC", the intent "book-flight" is matched and NYC has been extracted as the _to_ slot. Then, the bot tries to fill the remaining slots _from_ and _when_.
