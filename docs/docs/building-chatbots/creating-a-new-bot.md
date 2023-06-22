---
id: creating-a-new-bot
title: Creating a New Bot
---

--------------------

Creating a chatbot with Botpress is very straight forward and can be done by technical and non-technical people. It only take a few steps and you're ready to go.

You can build chatbots to:
- book an event;
- order something;
- welcome your users;
- deflect support cases;
- anything you have in mind. 

## Prerequisites

You need to:
- [install Botpress](/overview/quickstart/installation);
- register your email address;
- have the right permissions.

## Creating a Bot

Now that you have everything you need, let's start with creating a new bot.

1. Open Botpress.
1. Log in to Botpress.
:::note
The landing page shows all your **Bots**. If you just created the account, there is nothing on the page.
:::
1. At the top right of the page, click **Create Bot**. Then, click **New Bot**.
    1. The **Create a new bot** window appears.
    1. Under **Bot Name**, type the desired name for your bot. It enters the same name in the **Bot Id** box.
    :::note
    You can change it anytime. Your users can see it. 
    :::
    1. Under **Bot Id**, type the desired ID for your bot, if different than your **Bot Name**. The length has to be between 3 and 50 characters, without special characters.
    :::caution
    The **Bot Id** can't be modified. Your users can see it in the URL bar.
    :::
    1. Under **Bot Template**, you can select the bot you want to create:
        - **Welcome Bot**: a chatbot that helps you start your Botpress journey.
        - **Small Talk**: a chatbotbot that is essentially made of Q&As.
        - **Empty Bot**: a brand-new chatbot that you start from scratch.
        - **Learn Botpress Basics**: a complete chatbot that you can create while following [these instructions](https://botpress.com/mars-rover-tutorials) or analyze the content.
        - **Weather Bot**: a chatbot that gives you the current weather in a given city. Follow [these instructions](https://github.com/botpress/v12/tree/master/modules/examples#weatherbot) to make it work.
    1. Click **Create Bot**.
1. Now that your bot is created, you will be redirected to the **Bots** page.
1. Click the name of your bot, and be creative!

## Bot Options

In your **Bots** page, next to the name of your bot, you have three buttons that you can click:

### Config

Clicking this button redirects you to the **Bot Configuration** page, where you have three tabs:

#### General

The **General** page is where you can change:

- the name of your bot;
- the status: published (visible to everyone), collaborators only (only visible to collaborators), unmounted (not visible to anyone);
- the description of your bot;
- the default language:  Arabic, Dutch, English, French, German, Hebrew, Italian, Japanese, Polish, Portuguese, Russian, Spanish;
- the supported languages (see default languages).

#### Additional Details

The **Additional Details** page shows all the details about the owner of the bot:

- website;
- phone number;
- contact e-mail;
- link to terms and conditions;
- link to privacy policy.

#### Avatar & Cover Picture

The **Avatar & Cover Picture** page is where you can change:

- your bot avatar;
- your cover picture.

### Open Chat

Clicking the **Open Chat** button redirects you to the chatbot. It's what your users see when they chat with your bot, with your customizations.

### Others (the three lines)

Clicking this button opens a menu where you can choose between:

#### Apps

The **Apps** menu gives you three options:

- **Analytics**;
- **[HITL Next](/chatbot-management/agent-handover/human-in-the-loop/hitlnext)**;
- **[Misunderstood](/chatbot-management/language-understanding/misunderstood)**.

#### Edit in Studio

The **Edit in Studio** buttons redirects you to the [Conversation Studio](/overview/quickstart/conversation-studio).

#### Copy Link to Clipboard

The **Copy Link to Clipboard** button copies the URL of your chatbot so you can paste it somewhere.

#### View Logs

The **View Logs** buttons redirects you to the **Logs** tab in the [Conversation Studio](/overview/quickstart/conversation-studio).

#### Create Revision

The **Create Revision** button allows you to save a copy of your chatbot at a precise time. This allows you to test whatever you want and [rollback](#rollback) to the last revision version, if needed.

#### Rollback

:::info
You must have [revisions](#create-revision) if you want to use the **Rollback** option.
:::

The **Rollback** button allows you to go back to an older version that you saved with the **[Create Revision](#create-revision)** button. When clicking it, a new windows appears where you can select the revision you want. You must check the box before clicking **Rollback**.

:::caution
This overwrites all the work you have done after saving your revision.
:::

#### Export

The **Export** button allows you to export a `.tgz` file and save it on your computer so you can import it later.

#### Delete

The **Delete** button deletes your bot forever. A message will appear so you can be sure you want to delete the selected bot.

:::danger
Deleting a bot can't be undone.
:::