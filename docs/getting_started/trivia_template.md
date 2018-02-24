---
layout: guide
---

## Bot Templates

For starters, we recommend that you start by cloning a bot template and customize this template instead of starting your bot entirely from scratch.

> **Note:** Starting a bot from scratch is possible, but it requires that you learn the internal workings of Botpress. The only people that need to start from scratch are usually people creating templates.

## The **Trivia Template**

In this guide, we will be customizing a simple template of the Trivia bot that we created specially for you, the learner of Botpress! We intentionally left out many details and elements from the Trivia bot that you will be able to add by following this guide.

The version of the bot that you will be starting off from will already do the following things:

- Be available on the **Webchat channel**
- Have a couple of Trivia Questions in its question bank
- Be able to understand the logic of to play a Trivia Quizz game
  - When you say `"play"`, the bot **starts a new game**
  - The bot will ask you **3 questions**
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

> **Note:** We recommend you follow this guide sequentially for the first time, but the template contains a snapshot for every step, so you can skip some sections if you feel like it.

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

If everything goes well, you should see some reassuring messages in the console.

## Speaking with your bot

The bot comes with built-in integration with the Webchat channel. To open the webchat, navigate to this url: [http://localhost:3000/lite/?m=platform-webchat&v=fullscreen](http://localhost:3000/lite/?m=platform-webchat&v=fullscreen)

Now say "`play`" to your bot bot begin playing a Trivia game 🎲! 

We challenge you to score 100%!

### Viewing on your mobile

To easiest way to speak with your bot using your phone is to open a tunnel to expose your local bot publicly to the internet. We recommend using one of the following tools:

- [PageKite](https://pagekite.net)
- [Ngrok](https://ngrok.io)
- [Localtunnel](https://localtunnel.github.io/www/)

When using any of these tools, make sure you **make them point to port `3000`**. Once done you should be able to access the webchat from your phone at a url similar to `https://487f83.ngrok.io/lite/?m=platform-webchat&v=fullscreen`.
