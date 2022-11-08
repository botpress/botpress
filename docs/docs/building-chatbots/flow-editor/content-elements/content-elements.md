---
id: content-elements
title: Content Elements
---

--------------------

Botpress includes its own **Content Management System** (or **CMS**) to manage a chatbot's content. Everything your chatbot says comes from the CMS. Before we start discussing how you can create and edit the content of your chatbot, you should understand the different concepts of the CMS in Botpress.

## Content Types

A **Content Type** defines the structure of what the chatbot sends. It also dictates how your chatbot should render the content. It can be as straightforward or as complex as you want. For instance, a content type could be a simple text or an image, or a carousel. 

:::tip
As a general rule, the more domain-specific the content types are, the easier it is to manage the chatbot for non-technical people.
:::

Content types are particular to the chatbots to which they are associated. Here are some typical examples:

- A restaurant `Menu` and `MenuPage` types;
- A `QuestionWithChoices` type;
- An `ImportantBroadcast` type.

As you can see, content types on Botpress are much more specific than generalized "message types" on traditional chatbot building platforms.

Developers define content types in JavaScript. Each content type has its own `.js` file, and Botpress automatically finds and registers new content types based on the directory and naming convention of the file.

## Content Element

A **Content Element** contains the data of a content type. Multiple Elements can belong to a single content type. For instance, the "text" content type will include an element for every sentence of your Bot.

**Example:**

```json
{
  "id": "builtin_text-pSsHWg",
  "formData": {
    "text": "👋, {{state.$r}}!",
    "variations": ["Hello, {{state.$r}}!", "Welcome to Botpress, {{state.$r}}!"],
    "typing": true
  },
  "createdBy": "admin",
  "createdOn": "2018-05-14T00:57:36.026Z"
}
```

All content elements of the same content type are stored within a single `.json` file under the `data/bots/{your-bot}/content-elements/` directory.

:::tip
Remember that a content type tells how content gets rendered and a content element tells what to render.
:::

## Adding Content

You can add and edit content in two ways:

### Flow Editor

You can add content while creating a node in the Flow Editor. 
1. Click the plus button.
1. Choose **say something**. 
1. Click the file icon.
1. Choose a content type.
1. Select **Add New**.

![Adding Content Via Flow Editor](/assets/add-content-flow.png)

### Content Interface

In Botpress Studio Interface, you can add content to your chatbot. 
1. Navigate to the **Content** tab.
1. Click the plus sign next to **Filter by Content-Type**. 
1. Enter the information needed.

:::tip
You can also add a specific content type by clicking the **plus** button, which appears when you hover over the content title.
:::

![Adding Content Via Interface](/assets/adding-content.png)

The content interface is useful for the separation of concerns. You may want a non-technical collaborator to look through the content, editing it for grammar, and creating the desired tone for your chatbot.

## Translation

Your chatbots can support multiple languages. If a specific translation is not available for the current language, the chatbot will use the default language. When a user chats with your chatbot, we extract the browser's language and save it as a user attribute (available on the event as `user.language`).

Once the `user.language` property is set, it won't be overwritten. Therefore, you can ask the user what his preferred language is or use the NLU engine to detect it.

When rendering content elements, we will try to render the user's configured language; otherwise, it will use the chatbot's default one.

## Supported Content Types

### Action Button

This button triggers an action, often used in cards. You can add two parameters to this button, namely:
- Title: Text written on the button.
- Action: One of _say something, open url_ and _create postback_.

### Audio

Allows you to upload an mp3 audio file. The file will be playable within the chat.
![Audio Content](/assets/audio-emulator.png)

### Card

A card is a message with a title and an optional subtitle. It also contains an image and action buttons. Note that you first need to create the action button separately.

### Carousel

A carousel is an array of cards. This collection of cards can either be presented as a horizontally scrolling slide or a vertical message stack, depending on the channel.

### File

The file content type is currently only supported by channel-vonage. It allows you to upload a pdf file which the user can download from the chat. In addition, you can add an optional title which will appear as a message under the file. When loading a file from a variable url, you may need to use triple braces to unescape the url i.e., ```{{{temp.fileUrl}}}```.

### Image

To show an image with an optional title in the chat window, you can use the _Image_ content element. Supported image formats are .tiff, .jpg, .png, .jpeg, .gif, .bmp, .tif. When loading an image from a variable url, you may need to use triple braces to unescape the url i.e., ```{{{temp.imageUrl}}}```.

### Location

The location content type is currently only supported by channel-vonage. It generates a message showing a location with an optional address and title. Required parameters to complete this content element are longitude and latitude.

### Single Choice

This component carries a message, usually a question, and suggests choices to the user to fulfill the message. The user can only pick one option, and on selecting the preference, you can instruct your chatbot to get a custom value.

### Text

The text content type denotes a regular text message with optional typing indicators and alternates. You can use markdown in your text to add formatting and style, but please ensure that the target channel can render this text. 

You can write HTML in the text content on the web channel, and your chatbot will render it correctly. This opens up the possibility of including iFrames and constructing miniature web pages (commonly known as web views) in your content without creating custom components.

### Video

The video content type presents a message showing a video file with an optional title. You can either upload the video or link to a video file that will be fetched when the content element is invoked. When loading a video from a variable url, you may need to use triple braces to unescape the url i.e., ```{{{temp.videoUrl}}}```.

### Dropdown 

The dropdown displays a list of options to the user. It includes a message to the user, and you can customize the dropdown placeholder text and the text displayed on the selection button.