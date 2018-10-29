---
id: philosphy
title: Introduction
---

Welcome to the Botpress Developer's Guide!

Building bots is something new and sounds like a fun challenge for most developers.
To be able to create software that converses in a natural way with humans is an exciting new reality.

But you don’t want to spend hundreds of hours learning and putting together all
the infrastructure and boilerplate code required to get a basic conversational backend up and running.

That’s where Botpress jumps in. We believe in making it super-fun and productive for developers
to build high-quality bots. Botpress allows you to focus on the fun stuff and over-deliver in record time.
Most importantly, you want a platform that you can trust is flexible enough to scale with
any requirements that might come down the line.

Botpress’ goal is to empower developers to create the highest quality bots as fun and as quickly as possible.

## Why Botpress is different

We enable technical people to easily create bots, but also enable non-technical people
to manage and maintain them post-deployment.

In this way, we’re different from Bot Framework and Botkit, because these frameworks only
focus on the basic messaging infrastructure. We’re in reality much closer to a platform like
Chatfuel or ManyChat, except that you can fully customize the bot in ways that are natural to developers.

Although all of the above sounds too good to be true, Botpress is not for everyone.
Botpress was built for developers and does not currently aim to allow non-developers
to build bots (without a considerable learning curve).

Developers build bots, then non-technical people can manage them.

## The technology behind Botpress

Botpress is 100% written in TypeScript.

The backend runs on [Node.js](https://nodejs.org), [SQLite](https://www.sqlite.org) and – in production – [PostgreSQL](https://www.postgresql.org).

The frontend runs on [React](https://reactjs.org)/[Redux](https://redux.js.org)/[Bootstrap](https://getbootstrap.com/).
We’re also using all sort of cool libs such as [Socket.IO](https://socket.io/), [Lodash](https://lodash.com/), [Axios](https://github.com/axios/axios), [JWT](https://jwt.io/), [Knex](http://knexjs.org/) and [Bluebird](http://bluebirdjs.com/).

Botpress is lightweight, blazing fast and has zero system dependencies (apart from Node.js - except when you download the binary)

Botpress works on Windows, macOS, and Linux. It can run anywhere: on your laptop, on any cloud provider
and even on your private corporate infrastructure.

## What’s new in Botpress XX

### If you're coming from Botpress X

Botpress XX is mostly compatible with Botpress X. Most of your bots may be transferred effortlessly. Flows, QNA, NLU and Content Elements are the same. The biggest changes are under the hood, and in the database (to support multi-bots). There are some changes to Content Types / Renderers. You can read about the migration of your bots [on this page]()./migration)

### Botpress X

Botpress X now allows non-technical users to create and edit the bot content through the Content Manager.

The new Flow Builder and Dialog Manager make it much easier for developers to build and debug complex conversation flows.
Since the new system is also entirely stateless, Botpress now fully and seamlessly scales to multiple instances.

### Changes between Botpress 1.0/1.1 and Botpress X

Botpress X isn’t meant to be backward compatible with Botpress 1.0/1.1, although your old bots should theoretically
run without much change to the code. Be aware that we deprecated the Convos in favor of the new
Flow Builder and Dialog Manager. For these reasons, we suggest that you bootstrap a new
Botpress X bot and manually migrate the logic to Botpress X.
