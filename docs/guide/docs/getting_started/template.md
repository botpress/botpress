---
id: templates
title: Templates
---

## Bot Templates

We recommend that you start by cloning a bot template and customize this instead of starting your bot entirely from scratch.

> **Note:** Starting a bot from scratch is possible, but it requires that you learn the internal workings of Botpress. The only people that need to start from scratch are usually people creating templates.

## The **Trivia Template**

In this guide, we will be customizing the template that we created especially for you, the learner of Botpress! We intentionally left out many details and elements from the template that you will be able to add by following this guide.

The version of the bot that you will be starting off from will already do the following things:

- Be available on the **Webchat channel**
- Have a couple of Trivia Questions in its question bank
- Be able to understand the logic to play a Trivia Quiz game
  - When you say `"play"`, the bot **starts a new game**
  - The bot asks you **3 questions**
  - At the end of the game, it will tell you your score

### What we will be implementing

That's a very basic bot, but we will be adding the following things:

- New trivia questions
- Be able to respond to other keywords other than `"play"`
- Use NLU (Natural Language Understanding) to make it smarter
- Be able to ask and remember your name
- Be able to keep track of a basic leaderboard
- Be able to connect to Facebook Messenger
- An improved version of the leaderboard on Facebook

### What you will learn

At the end of this guide, you'll have learned the following concepts:

- Using Botpress dashboard
- Using the Dialogue Tracer to debug your bot
- The basics of the Content Manager
- The basics of the Flow Editor
- Installing Flow Skills to extend the Flow Editor
- Leveraging NLU inside Botpress
- The file structure of a Botpress bot
- Creating custom Actions
- Creating custom Content Types
- Creating custom Content Renderers

> 🌟 **Tip:** If you are already familiar with Botpress but need a quick refresher about something, click one of the links to jump directly to that concept.

## Getting the template

### Cloning from GitHub

Let's clone the template which is hosted [on GitHub](https://github.com/botpress/tutorial). You can clone this anywhere on your local computer. Once cloned, navigate in that directory.

```bash
# clone the repo
git clone https://github.com/botpress/tutorial.git

# navigate to the directory
cd tutorial
```

You'll notice that you have several folders named `step-*`. We will start at **Step 1** and build up the bot from there. So you should `cd` into the `step-1` folder and install the dependencies.

```bash
cd step-1

# using npm
npm install

# using yarn
yarn install
```

Once all the dependencies are installed, you can start the bot to see if everything is working properly:

```bash
#using npm
npm start

# using yarn
yarn start
```

If everything goes well, you should see:
```bash 
info: Bot launched. Visit: http://localhost:3000
``` 
Should you get an error, please search our [forum](https://help.botpress.io/) to see if anyone has had a similar problem and ask for help from the community. If it is an issue in the codebase, head over to GitHub to [open an issue](https://github.com/botpress/botpress/issues/new).

## Speaking with your bot

The bot comes with a built-in integration for the Webchat channel. To open the webchat, navigate to: [http://localhost:3000/lite/?m=platform-webchat&v=fullscreen](http://localhost:3000/lite/?m=platform-webchat&v=fullscreen)

Now say "`play`" to your bot to begin playing a Trivia game 🎲!

We challenge you to score 100%!

### Viewing on your mobile

The easiest way to speak to your bot using your phone is to open a tunnel to expose your local bot publicly to the internet. We recommend using one of the following tools:

- [PageKite](https://pagekite.net)
- [Ngrok](https://ngrok.io)
- [Localtunnel](https://localtunnel.github.io/www/)

When using any of these tools, make sure you **point the tool in question to port `3000`**. Once done you should be able to access the webchat from your phone at an URL similar to `https://487f83.ngrok.io/lite/?m=platform-webchat&v=fullscreen`.
