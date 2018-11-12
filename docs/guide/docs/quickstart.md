---
id: quickstart
title: Quick Start
---

## CLI

You can run Botpress by using the _Command Line Interface_ (CLI), which we recommend doing when developing your bots since you can use the CLI to enable the critical debugging messages.

> **Tip**: To start your bot in development mode, use `./bp --verbose` or simply `./bp -v`.

To see all the commands available, run `./bp --help`.

##### Example

```
> ./bp --help
Options:
  --version         Show version number                                [boolean]
  --verbose, -v     verbosity level                         [count] [default: 0]
  --production, -p  run in production mode            [boolean] [default: false]
  --help            Show help                                          [boolean]
```

## Admin Panel

The first thing you'll need to do when you open the portal the first time is to setup your administrator password.

[TODO] Screenshot of password

The admin dashboard is the place where you'll be able to manage and configure everything related to your Botpress Server installation, including:

- Create bots and assign them to a team
- Create new teams and invite other administrators
- Create and manage user roles
- Configure your Botpress Pro license

### Creating a new bot

In Botpress, bots are always assigned to a team. When you start Botpress for the first time, you'll have a new team created automatically for you with an example bot inside it.

Let's create a new bot by first navigating to your team, then clicking the "Create new bot" button.

[TODO] Screenshots of create new bot (team + create)

All you have to do is pick a name for your bot and a unique `Bot ID` will be generated for you.

> The **Bot ID** can't be changed in the future so it's important to pick a meaningful name. Also bear in mind that this ID will be visible to the users of your bots.

Once created, click on the bot to open the Studio interface and edit your bot.

## Studio

The Studio is the main interface you'll use to build and edit your bot. From here, you can:

- Train an NLU model
- Create dialog flows
- Test and debug your bot

You will notice on the left there are a couple of sections available. Some of these are built inside Botpress (like _Content_ and _Flows_), where some are there because of modules installed. Indeed, Botpress is a highly modular platform and the majority of the features you will use are provided by the modules themselves.

### Test your bot

To test your bot, you can use the built-in chat emulator located in the top right corner (`1`). You can start over a new conversation with your bot by clicking the reset button (`2`).

Open the chat window and say "_Hello_". The bot should greet you with something like "_TODO_".

[TODO screenshot of chat emulator and reset button numbered]

### Question and Answer

One of the modules shipped by default with Botpress is the QnA (Question and Answer) module. This module allows you to easily and quickly add knowledge to your bot without having to create a flow or code anything. QnA uses the NLU Engine behind the scene to detect the questions and automatically answer them.

Let's add a new question [TODO]

### Logs

Show the logs window which are the same logs displayed in the CLI.

## Share your bot

Provide pre-built link to bot webchat. Link to the guide on how to embed it on your website.
