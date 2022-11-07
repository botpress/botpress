---
id: single-choice
title: Single Choice
---

The choice skill provides a way to select one choice of many in free text format or with buttons.

![choice](/assets/skills/choice-answer.png)

## Creating a Choice Skill

1. From the Flow Editor view, click **Insert Skill**.
1. Select **Choice**
   ![select-choice](/assets/skills/choice.png)
1. Select or create a **single choice** content-type
   ![choice-generating](/assets/skills/choice-generating.png)

:::note
You can disabled free text if you want your user to only be able to click buttons.
:::

### Single Choice options

#### Message

The message is the question your bot will ask.

#### Choice

Create choice related to a question.

##### Message

Label for the choice. This is what is displayed on the button.

##### Value

Value to expect for the selected option, for yourself.

### Using Intent Detection for Advanced Choice Recognition

Intents can also be used as the value to be able to catch variations of answers, and are manage in the NLU page. This is really useful for channels that don't support inline buttons like text messaging, where people type similar, yet not exact answers. 

You can accomplish this by adding `intent:INTENT_NAME` as a value to your choice skill. Then, make sure your `INTENT_NAME` exists in the NLU > Intents menu and has utterances. 

![intent](/assets/skills/intent.png)
