---
id: content-text
title: Content - Text
---

--------------------

The Text content is one of the most important piece of content that you will use. Those are the textual sentences that your chatbot sends to your user. 

![Text Example](/assets/text-example.png)

:::info
HTML in the text content is rendered correctly on the web channel. You can include iFrames and construct miniature web pages (or web views) in your content without creating custom components.
:::

## Add a Text in a Node

1. In the Flow Editor, click the node where you want to add your text.
1. Choose where to put your text: **On Enter**, **On Receive**, or **Transitions**.
1. Click the **+** button.
1. Under **Message**, click the box.
    1. In the **Pick Content** dialog, under **Search In**, select **Text**.
    1. You can either:
        - Select an existing text in the list.
        :::info 
        This will bring you directly to step 5.
        :::
        - Type a new text in the **Search Text** bar.
    1. Click **Create new Text**.
    1. A new window will be displayed where you can modify the following options:
        - The **[Add Alternates](#alternates)** button.
        - The **[Use markdown](#use-markdown)** radio button.
        - The **[Show typing indicators](#show-typing-indicators)** radio button.
    1. Click **Submit**.
1. Click **Add Action (Alt+Enter)**.

## Options

When adding a **Text** content, you can modify some options:

:::tip
When hovering a box where you can type, the `</>` symbol appears. This button helps you easily insert variables within your message. When you click it, it shows a list of variables that you can use such as `temp.`, `user.`, `session.`, or `event.`.
:::

### Alternates

Alternates are different sentences that mean exactly the same as the original text. Those will be sent randomly to your users. 

Adding alternates is easy. You just have to click **Add Alternates** and you will be able to write as many alternates as you want in the boxes.

You can use the trash icon to delete your alternate(s) whenever you want.

:::tip Best Practice
Adding alternates is recommended since it makes your chatbot more user-friendly. The more alternates you have, the more your chatbot looks "human".
:::

### Use Markdown

The radio button is checked by default. You can uncheck it.

You can use [markdown](https://daringfireball.net/projects/markdown/syntax#overview), which is a markup syntax that allows you to easily add formatting and style to your text. 

:::tip Best Practice
Ensure that the target channel can render this text.
:::

### Show Typing Indicators

The radio button is checked by default. You can uncheck it.

When your user is chatting with the chatbot, they will see the icon ![Type Indicators](/assets/type_indicators.png) (a bubble with three moving dots) while the chatbot is "typing" before receiving an answer.