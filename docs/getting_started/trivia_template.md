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

## Getting the template

- Git clone
- Yarn
- Yarn start
- Logs

## Speaking with your bot

- Webchat
- Testing on mobile / Ngrok / Localtunnel / Pagekite
