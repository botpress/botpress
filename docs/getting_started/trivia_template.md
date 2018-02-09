---
layout: guide
---

## Bot Templates

For starters, we recommend that you start by cloning a bot template and customize this template instead of starting your bot entirely from scratch.

> **Note:** Starting a bot from scratch is possible, but it requires that you learn the internal workings of Botpress. The only people that need to start from scratch are usually people creating templates.

## The **Trivia Template**

For the rest of this entire guide, we will be customizing a simple template that we created specially for you, learner of Botpress! We intentionally left out many details and elements that we will be adding together during this guide.

The version of the bot that you will be starting off from will already do the following things:

- Be available on the **Webchat channel**
- Have a couple of Trivia Questions in its question bank
- The logic to play a Trivia Quizz game
  - When you say `"play"`, the bot **starts a new game**
  - The bot asks you **3 questions**
  - At the end of the game, it tells you your score

### What we will be implementing

That's a very basic bot, but we will be adding the following things:

- New trivia questions
- Responding to other keywords than `"play"`
- Adding NLU (Natural Language Understanding) to make it smarter
- Make it ask and remember your name
- Keeping a basic leaderboard
- Connecting it to Facebook Messenger
- Perfecting the leaderboard on Facebook

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

> 🌟 **Tip:** Already familiar with Botpress but need a quick refresher about something? Click one of the links to jump directly to that concept.

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

Once all the dependencies installed, you can start the bot to see if everything is working properly:

```bash
#using npm
npm start

# using yarn
yarn start
```

If everything goes well, you should see some reassuring messages in the console.

## Speaking with your bot

The bot comes with built-in integration with the Webchat channel. To open the webchat, navigate to this url: [http://localhost:3000/lite/?m=platform-webchat&v=fullscreen](http://localhost:3000/lite/?m=platform-webchat&v=fullscreen)

Now you can say "`play`" to your bot, you'll be playing a Trivia game 🎲! 

We challenge you to score 100%!

### Viewing on your mobile

To speak with your bot using your phone, the easiest way is to open a tunnel to expose your local bot publicly to the internet. We recommend using one of the following tools:

- [PageKite](https://pagekite.net)
- [Ngrok](https://ngrok.io)
- [Localtunnel](https://localtunnel.github.io/www/)

Using any of these tools, make sure you **make it point to port `3000`**. Once done you should be able to access the webchat from your phone at a url similar to `https://487f83.ngrok.io/lite/?m=platform-webchat&v=fullscreen`.
