---
id: questions-&-answers
title: Questions & Answers
---

--------------------

The QnA module is specifically designed to simplify how to handle frequently asked questions. It adds more responsivness to your chatbot. You need to add at least ten different training phrases. Then, you add at least one answer: plain text or any other content type. 

:::note
You can also redirect a user to a specific node and workflow as a response to the question.
:::

![Adding a QnA](/assets/qna-overview.png)

## Create a Context

1. Access your Conversation Studio.
1. Click the Q&A tab.
1. Click the + button at the top right of the page. 
:::note
It creates a new Q&A.
:::
1. Under **Contexts**, type the context you want to add.

:::tip
You can alternatively create a context as follows:
1. Create a context specific to:
  - one chatbot, create or edit this file `data/bots/<your_bot>/config/qna.json`.
  - all chatbots, create or edit this file `data/global/config/qna.json`.
2. Append the name of your new contexts to `qnaCategories` as follows:

```json
{
  "$schema": "../../../assets/modules/qna/config.schema.json",
  "qnaCategories": "global,monkeys,giraffes"
}
```
:::

:::note
Contexts listed in the dropdown menu are sourced from all your existing content (questions & NLU intents). The `qna.json` configuration file is no longer used to provide a list of contexts.
:::

![New Context](/assets/faq-qna-new-context.png)

## Add a QNA

Once you have created your contexts, you can create your QNAs and assign a context to them. From the `category` menu, choose one of your contexts:

![QnA Category](/assets/faq-qna-category.png)

# Add Contexts to your Flow

The final step is to set the desired context at the appropriate time in your flow. To help you with this, we added 3 built-in actions (e.g., `appendContext`, `resetContext` and `removeContext`), under the NLU category in your actions list.

### Append Context

To set a context, use the `appendContext` action and add your new context in the `contexts` field. You can use comma-separated values to pass multiple contexts.

![Actions](/assets/faq-append-context.png)

### TTL

The TTL or Time-To-Live field is used to set a maximum number of interactions for this context to exists within a conversation.

:::note Example
Take `Welcome Bot` for instance. Its contexts have a TTL of `10`. 

This means that someone can ask up to 10 questions about animals before the context is ignored. After the TTL expires, the chatbot will fall back to the `global` context.
:::