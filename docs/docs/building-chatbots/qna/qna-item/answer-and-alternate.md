---
id: answer-and-alternate
title: Answer and Alternate
---

--------------------

When you use the Q&A section, you can have a question (or more, which is recommended) and one answer or you can create alternate answers. Those are randomly sent to the users. This makes the chatbot more "human". 

Alternate answers have a different structure, but their meaning stays the same.

## Add Answers and Alternates

1. In the [Conversation Studio](/overview/quickstart/conversation-studio), click the **Q&A** tab.
1. If not done yet, [create a question](/building-chatbots/qna/qna-item/question-variations).
1. Under **Answer**, type the basic answer to the question in the box.
1. Click **+ Add Answer Alternatives**.
1. Type as many alternatives you need.
:::tip Best Practice
Press `enter` after typing your answer. It quickly adds a new alternative.
:::
1. You might have to train your chatbot again.
1. Try it with the **[Emulator](/building-chatbots/testing-&-debugging/emulator)**.

The number of answers is not important. It could be 1 or 10, or even more, it won't make a difference for the Language Understanding. However, for the [questions](/building-chatbots/qna/qna-item/question-variations), you might want to add different utterrances to teach your chatbot that it doesn't have to precisely match the question asked.

## Answers and Alternates Examples

When a user ask for the opening hours, you could add those alternate answers:

- `Monday to Friday from 8AM to 5PM.`
- `We are opened from Monday to Friday at 8AM until 5PM.`
- `Our opening hours are from 8AM to 5PM on weekdays. `
- `You can reach us from 8AM to 5PM every day of the week.`
- `The store opens at 8AM and closes at 5PM every weekday.`
- etc.

## Tags

You can see some tags at the top right of the page.

### Can't Be Saved

When hovering the tag, you can see what is wrong: leaving the question or the answer field empty will disable the question.

It disappears when the problem is solved.

### Incomplete

When you have one question, only the exact match will trigger an answer from the chatbot.

It disappears when the problem is solved.

### *X*Q · *X*A

The `X` represents the number of questions and answers that you have for this Q&A.