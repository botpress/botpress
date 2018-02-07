---
layout: guide
---

## The Botpress Philosophy <a class="toc" id="botpress_philosophy" href="#botpress_philosophy"></a>

Building bots is something new and sounds like a fun challenge for most developers. 
To be able to create software that converse in a natural way with humans is an exciting new reality.

But you don’t want to spend hundreds of hours learning and putting together all 
the infrastructure and boilerplate code required to get a basic conversational backend up and running.

That’s where Botpress jumps in. We believe in making it super-fun and productive for developers 
to build high-quality bots. Botpress allows you to focus on the fun stuff and over-deliver in record time. 
Most importantly, you want a platform that you can trust is flexible enough to scale with 
any requirements that might come down your way.

Botpress’ goal is to empower developers to create the highest-quality bots as fun and as quickly as possible.

## Why Botpress is different <a class="toc" id="why_different" href="#why_different"></a>

We allow technical people to easily create bots, but also allow non-technical people 
to manage and maintain it post-deployment.

In this way, we’re different than Bot Framework and Botkit, because these frameworks only 
focus on the basic messaging infrastructure. We’re in reality much closer to a platform like 
Chatfuel or ManyChat, except that you can fully customize it and Botpress is much closer 
to what a developer would expect.

Although all of the above sounds too good to be true, Botpress is not for everyone. 
Botpress was built for developers and does not currently aim to allow non-developers 
to build bots (without a considerable learning curve).

Developers build bots, then non-technical people can manage them.

## The technology behind Botpress <a class="toc" id="tech_behind" href="#tech_behind"></a>

Botpress is 100% Javascript.

The backend runs on NodeJS, SQLite and – in production – Postgres.
The frontend runs on React/Redux/Bootstrap.
We’re also using all sort of cool libs such as Socket.IO, Lodash, Axios, JWT, Knex and Bluebird.

Botpress is lightweight (~10mb), blazing fast and has zero system dependencies (appart from NodeJS).

Botpress works on Windows, MacOS and Linux. It can run anywhere: on your laptop, any cloud provider 
and even on your private corporate infrastructure.

## What’s new in Botpress X <a class="toc" id="whats_new" href="#whats_new"></a>

### If you’re coming from Botpress 1.0/1.1 <a class="toc" id="coming_from_1_1" href="#coming_from_1_1"></a>

Botpress X isn’t meant to be backward compatible with Botpress 1.0/1.1, although your old bots should theoretically 
run without much change to the code. Be aware that we deprecated the Convos in favor of the new 
Flow Builder and Dialog Manager. For these reasons, we suggest that you simply bootstrap a new 
Botpress X bot and manually migrate the logic to Botpress X.

### Botpress X <a class="toc" id="botpress_x" href="#botpress_x"></a>

Botpress X really emphasizes more on non-technical users being able to create and edit the bot content through the Content Manager.

The new Flow Builder and Dialog Manager makes it much easier for developers to build and debug complex conversation flows. 
Since the new system is also totally stateless, Botpress now fully scales out to multiple instances.
