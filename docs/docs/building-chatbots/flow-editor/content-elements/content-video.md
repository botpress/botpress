---
id: content-video
title: Content - Video
---

--------------------

The video content type presents a distinct message with a video file and an optional title.

:::caution
This content type is only supported in [Botpress Webchat](/messaging-channels/botpress-webchat/website-embedding) and [Vonage](/messaging-channels/broker-integrations/vonage).
:::

![Video Example](/assets/video-example.png)

The users can:
- play the video;
- pause it when needed;
- modify the sound level;
- zoom in the video;
- download the video;
- change the playback speed;
- have a picture in picture (a pop-up with the video will appear).

## Add a Video in a Node

1. In the Flow Editor, click the node where you want to add your video.
1. Choose where to put your video: **On Enter**, **On Receive**, or **Transitions**.
1. Click the **+** button.
1. Under **Message**, click the box.
    1. In the **Pick Content** dialog, under **Search In**, select **Video**.
    1. You can either:
        - Select an existing video in the list.
        :::info 
        This will bring you directly to step 5.
        :::
        - Click **Create new Video**.
    1. A new window will be displayed where you can modify the following options:
        - The **[Video](#video)** box.
        - The **[Title](#title)** box.
        - The **[Show typing indicators](#show-typing-indicators)** radio button.
    1. Click **Submit**.
1. Click **Add Action (Alt+Enter)**.

## Options

When adding a **Video** content, you can modify some options:

:::tip
When hovering a box where you can type, the `</>` symbol appears. This button helps you easily insert variables within your message. When you click it, it shows a list of variables that you can use such as `temp.`, `user.`, `session.`, or `event.`.
:::

### Video

There are two ways to add a video:

- Under **Video**, click the square with an up arrow. Then, you can choose which video you want to add there from your storage. 
- Under **Video**, click the **Or enter URL** button at the bottom right of the square. A box will appear and you can type the URL of your video.

:::info
When loading a video from a variable URL, you might need to use triple braces.

**Example:** `{{{temp.imageUrl}}}`
:::

### Title

This is a box where you can add a title to your video.

:::tip Best Practice
Your title should be short, precise, and relevant.
:::

### Show Typing Indicators

The radio button is checked by default. You can uncheck it.

When your user is chatting with the chatbot, they will see the icon ![Type Indicators](/assets/type_indicators.png) (a bubble with three moving dots) while the chatbot is "typing" before receiving an answer.