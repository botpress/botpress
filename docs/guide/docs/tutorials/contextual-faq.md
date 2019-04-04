---
id: contextual-faq
title: Contextual FAQ
---

## Create a context

To create context, you have two options:

- Create context specific to a bot, create or edit this file `data/bots/<your_bot>/config/qna.json`.
- Create context specific to all bots, create or edit this file `data/global/config/qna.json`.

Then append the name of your new contexts to `qnaCategories` like so:

```json
{
  "$schema": "../../../assets/modules/qna/config.schema.json",
  "qnaCategories": "global,monkeys,giraffes"
}
```

## Add a QNA

Once you have created your contexts, you can create your QNAs and assign a context to them. From the `category` menu, choose one of your contexts:

![Category](assets/faq-qna-category.png)

## Add contexts to your flow

The final step is to set the desired context at the appropriate time in your flow. To help you with this, we added 3 actions (i.e. `appendContext`, `resetContext` and `removeContext`). You will find these actions under the NLU category in your actions list.

### Append Context

To set a context, let's use the `appendContext` action and add our new context in the `contexts` field. You can use comma-separated values to pass multiple contexts.

![Actions](assets/faq-append-context.png)

### TTL

The TTL or Time-To-Live field is used to set a maximum number of interactions for this context to exists within a conversation.

Take `Welcome Bot` for instance. Its contexts have a TTL of `10`. This means that someone can ask up to 10 questions about animals before the context is ignored. After the TTL expires, the bot will fallback to the `global` context.
