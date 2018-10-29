---
id: content
title: !!Content
---

# 📚 Types, Elements, Renderers

Before we start discussing how you can create and edit the content of your bot, we should understand the different concepts of the Content Management in Botpress.

## Content Type

A **Content Type** describes a grouping of Content Elements sharing the same properties. They can describe anything and everything – they most often are domain-specific to your bot.

> **🌟 Tip**: As a general rule, the more domain-specific the Content Types are, the easier it is to manage the bot for non-technical people.

Content Types are very specific to the bots they are associated with. Here are some typical examples:

- A restaurant "Menu" and "MenuPage" types
- A "QuestionWithChoices" type
- An "ImportantBroadcast" type

As you can see, Content Types on Botpress are much more specific than generalized "message types" on traditional bot building platforms.

Content Types are defined by developers in JavaScript. Each Content Type has its own `.js` file and Botpress automatically finds and registers new Content Types based on the directory and naming convention of the file.

## Content Element

A **Content Element** is a single item of a particular Content Type. Content Types contain many Elements. An Element belongs to a single Content Type.

All Content Elements of the same Content Type are stored within a single `.json` file under the `data/bots/{your-bot}/content` directory.

## Content Renderer

A **Content Renderer** defines how a **Content Type** gets rendered on the different channels.

> **Note:** This is critical because every channel is different and has a different set of functionalities. You want to be able to customize and leverage the features of the different platforms to offer the best user experience as possible.

Content Renderers are defined by developers in JavaScript. They are defined in the same file as the content type.
