---
layout: guide
---
# Installing 

The choice skill can be installed from the npm registry.

```bash 
# using npm
npm i @botpress/skill-choice
# using yarn 
yarn add @botpress/skill-choice
```

Once installed, restart your bot and the skill will be automatically detected and loaded by your bot.

# Using the choices skill

Skills are added to the flow of your bot using the Botpress Flows GUI.

You will find a dropdown list in the toolbar to `Insert Skill` 

![Image showing the Skills Menu][Skills_Menu]

After selecting the choice skill you will need to click on the folder icon to ether create or select an existing choice configuration.

When you chick on the `Create new Single Choice` you will be presented with a form where you will be able to configure this instance.

- Message - This is the Question that is asked to the user
- Choices - This is a collection of the buttons that will be presented to the user
  - Message - This is the text that will be shown in the button
  - Value - This is the value the bot will receive when the corresponding button is pressed

![GIF showing how to create a new choice][Choice_Gif]

# Advanced

## Hiding Choices

As of version [10.31](https://github.com/botpress/botpress/blob/master/CHANGELOG.md#10310-2018-08-08), you are able to configure the choice skill to handle a choice but stop it from being displayed to the user in the conversation. This allows you top handle edge cases or unpopular conversation paths without cluttering up the user interface for most users.

Options can be hidden by prefixing ether the title or the message with `!hide`. 

In the example used below we have added the `!hide` flag to the option of Pineapple in both the Choices Message (this is the button that gets shown to the user) and the Value (this is what the bot receives when the button is selected). 

![Image showing the ways to add the !hide flag][Hide_Items]

> **Note**: A Choice skill cannot be affed to the flow if it only has a hidden option. If only hidden choices are present the insert button will be disabled

![Image showing the inset button disabled][Hidden_no_Insert]

## Choice and NLU

With the choice skill you are able to link a choice item (pineapple in the above example) with an intent in your NLU model.

Continuing on from the example above, add a model for pineapple. In the NLU tab, create a new intent called `fruit_pineapple`. `fruit_` is used to group the intents together for our example choice, "pick a fruit".

![Image showing a new intent created][create_Pineapple]

Then add some utterances that a user my use to describe a pineapple. We have gone for `green and orange` and `spiky`.

Now back in your choice skill, add the tag of `intent:fruit_pineapple`. This means that if a user were to type in ether of our utterances above, the choice of `pineapple` would be selected by the bot.

![Image showing how to link an intent to a choice][intent_To_Choice]

[Skills_Menu]: {{site.baseurl}}/images/skills/choice/skills_Menu.png
[Hide_Items]: {{site.baseurl}}/images/skills/choice/hide_Items.png
[Hidden_no_Insert]: {{site.baseurl}}/images/skills/choice/hidden_no_Insert.png
[Choice_Gif]: {{site.baseurl}}/images/skills/choice/insert_Choice.gif
[create_Pineapple]: {{site.baseurl}}/images/skills/choice/create_Pinapple.png
[intent_To_Choice]: {{site.baseurl}}/images/skills/choice/intent_to_choice.png