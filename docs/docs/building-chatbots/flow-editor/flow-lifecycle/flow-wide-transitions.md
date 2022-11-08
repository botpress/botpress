---
id: flow-wide-transitions
title: Flow-wide Transitions
---

--------------------

## onReceive
You can define an `onReceive` instruction that will always be executed before every node's `onReceive`.

To define new **Flow-wide On Receive** actions:
1. Navigate to the relevant flow.
1. Double-click anywhere to show the **Flow Properties**. 
:::tip
You can also click the links at the top left corner of the flow editor.
:::
1. Under the **On Receive** section, click the **Add Action** button to add a new action.

![Flow Properties](/assets/flow_wide_onreceive.png)

## onNext

A Flow-wide onNext instruction allows you to override node transitions when the condition is successful.

:::note Examples:
- Authentication Gate: Re-route the user to the login flow if they are not authenticated.
- Sentiment Analysis: Re-route the user to the human fallback node if the conversation is degrading
- Matching flow-wide intents such as "`cancel`" etc.
:::