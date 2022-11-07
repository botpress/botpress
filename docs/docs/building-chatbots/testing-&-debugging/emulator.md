---
id: emulator
title: Emulator
---

--------------------

You can debug your bot conversation by using the built-in Emulator Window.

:::note
To visualize the entire user experience, you should use the Web Channel directly.
:::

## Open the Emulator

- Press `e` anywhere in the application;
- Click the Emulator icon in the status bar.

![Emulator Window](/assets/emulator_icons.png)

## Close the Emulator

You can close the Emulator by:
- pressing **ESC** on your keyboard; 
- clicking again on the emulator icon.

## Resend the Same Messages

Pressing **↑** or **↓** on your keyboard in the text input allows you to navigate and re-send previously sent messages quickly. 

:::info
The last 20 messages sent to this bot are persisted in your browser storage.
:::

## Payload Inspector

The payload inspector lets you see and understand what the bot understood and why it took the decision he chose. Inside the emulator, you will see the metadata about NLU, the conversation State, and the raw responses.

![Emulator Window](/assets/emulator_win_inspector.png)

![Emulator Window](/assets/emulator_win_raw_json.png)

## Sessions

All the messages you send with the Emulator comes from the same user from the bot's perspective.

To start a conversation from scratch, you can press the **Toggle List View** button in the Emulator menu. It generates a new user, so all previously set variables and states are forgottent.

## Testing Module

The **Testing** module allows you to simulate a conversation over and over again. This is useful when constructing a workflow that works with a set series of answers from the user. It is also handy to make sure that Q&As are being detected and handled as intended.

To activate the **Testing** module, enable it in `botpress.config.json` as follows:

```
    {
      "location": "MODULES_ROOT/testing",
      "enabled": true
    },
```