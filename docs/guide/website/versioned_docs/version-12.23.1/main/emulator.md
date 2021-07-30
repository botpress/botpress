---
id: version-12.23.1-emulator
title: Testing Conversations
original_id: emulator
---

You can debug your bot conversation by using the built-in Emulator Window. The emulator is meant for developers to debug the conversations and is not meant to replicate what the end-users see visually (i.e., some messages will not render correctly). To visualize the entire user experience, you should use the Web Channel directly.

To open the Emulator, you can:

- Press <kbd>e</kbd> anywhere in the application
- Click the Emulator icon in the status bar

![Emulator Window](../assets/emulator_icons.png)

You can close the Emulator by pressing <kbd>ESC</kbd> or by clicking again on the emulator icon.

## Resending the same messages

Using <kbd>↑</kbd> or <kbd>↓</kbd> on your keyboard in the text input will allow you to navigate and re-send previously sent messages quickly. The last 20 messages sent to this bot are persisted in your browser storage.

## Payload Inspector

The payload inspector lets you see and understand what the bot understood and why it took the decision he chose. Inside the emulator, you will see the metadata about [NLU](nlu), the conversation [State](dialog), and the raw responses.

![Emulator Window](../assets/emulator_win_inspector.png)

![Emulator Window](../assets/emulator_win_raw_json.png)

## Sessions

All the messages you send using the Emulator will come from the same user from the bot's perspective.

To start a conversation from scratch, you can press the **"Toggle List View"** button in the elipsis menu of the Emulator window. Doing this will generate a new user, so all previously set variables and states will be forgotten by the bot.

## Testing Module

The testing module allows you to simulate a conversation over and over again. This is useful when constructing a workflow that works with a set series of answers from the user. It is also handy to make sure that QnA s are being detected and handled as intended.

To activate the Testing module, enable it in botpress.config.json as follows:

```
    {
      "location": "MODULES_ROOT/testing",
      "enabled": true
    },
```

## Webchat Test Website
Botpress comes with a pre-built test website that offers an example of customizing the webchat with your custom CSS bundled with your default Botpress installation. Start the server, then head over to http://localhost:3000/assets/modules/channel-web/examples/embedded-webchat.html for an example. You can also check example sources at Github.

This example is also practical when you want others to test your chatbot. You can expose this website to the public internet then share the link.

![Test Website](../assets/test_website.png)
