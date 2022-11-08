---
id: context
title: Context
---

--------------------

Contexts are simple single words that are related to a specific situation, circonstance, concept, etc.

:::tip Best Practice
You should use contexts only for the questions and answers, not for replacing slot filling.
:::

## Step 1 - Create a context

To create a context, you have two options:

### In the Conversation Studio

1. Click the **Q&A** tab.
1. Click the **+** button at the top right of the page. 
1. Under **Contexts**, type the context you want to add.

:::note
Don't forget to create your [questions](/building-chatbots/qna/qna-item/question-variations) and [answers](/building-chatbots/qna/qna-item/answer-and-alternate).
:::

### In the Config File

:::tip Best Practice
It's way easier to add a context directly in the Conversation Studio.
:::

- Create context specific to a bot, create (or edit) this file `data/bots/<your_bot>/config/qna.json`.
- Create context specific to all bots, create (or edit) this file `data/global/config/qna.json`.

## Step 2 - Append your Context

To set a context, let's use the `appendContext` action and add our new context in the `contexts` field. You can use comma-separated values to pass multiple contexts.

![Actions](/assets/faq-append-context.png)

Then append the name of your new contexts to `qnaCategories` like so:

```json
{
  "$schema": "../../../assets/modules/qna/config.schema.json",
  "qnaCategories": "global,monkeys,giraffes"
}
```

