---
id: content-image
title: Content - Image
---

--------------------

The image content allows you to integrate an image (a picture) in your chatbot conversation as a distinct message.

![Image Example](/assets/image-example.png)

## Supported Formats

Supported image formats are:

- `.tiff`;
- `.jpg`;
- `.png`;
- `.jpeg`;
- `.gif`;
- `.bmp`;
- `.tif`.

:::info
When loading an image from a variable URL, you might need to use triple braces.

**Example:** `{{{temp.imageUrl}}}`
:::

## Add an Image in a Node

1. In the Flow Editor, click the node where you want to add your image.
1. Choose where to put your image: **On Enter**, **On Receive**, or **Transitions**.
1. Click the **+** button.
1. Under **Message**, click the box.
    1. In the **Pick Content** dialog, under **Search In**, select **Image**.
    1. You can either:
        - Select an existing image in the list.
        :::info 
        This will bring you directly to step 5.
        :::
        - **Create new Image** by clicking the button.
    1. A new window will be displayed where you can modify the following options:
        - The **[Image](#image)** button.
        - The **[Title](#title)** box.
        - The **[Show typing indicators](#show-typing-indicators)** radio button.
    1. Click **Submit**.
1. Click **Add Action (Alt+Enter)**.

## Options

When adding a **Image** content, you can modify some options:

:::tip
When hovering a box where you can type, the `</>` symbol appears. This button helps you easily insert variables within your message. When you click it, it shows a list of variables that you can use such as `temp.`, `user.`, `session.`, or `event.`.
:::

### Image

There are two ways to add an image:

- Under **Image**, click the square with an up arrow. Then, you can choose which image you want to add there from your storage. 
- Under **Image**, click the **Or enter URL** button at the bottom right of the square. A box will appear and you can type the URL of your image.

:::note
Don't forget to take a look at the list of [supported formats](#supported-formats).
:::

### Title

There is a box where you can add a title to your image. This title is displayed when you hover over the picture you just sent.

:::tip Best Practice
Your title should be short, precise, and relevant.
:::

### Show Typing Indicators

The radio button is checked by default. You can uncheck it.

When your user is chatting with the chatbot, they will see the icon ![Type Indicators](/assets/type_indicators.png) (a bubble with three moving dots) while the chatbot is "typing" before receiving an answer.