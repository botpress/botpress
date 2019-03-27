---
id: versions
title: Version control
---

Once your bot is deployed, the good part is that you (and non-technical team members) **can still make changes to your bots from the Botpress studio**. This is one major advantage of using Botpress. This is made possible by our built-in versioning system.

## Overview

As for now, you probably know that some of your bot's behavior is determined by the content coming from the files (Content, Flows, Actions).

For your convenience Botpress provides the GUI tools to edit these files while in development. We also provide the same tools in production, but there's a caveat. Writing changes to the server's file system is not always possible, they could easily be lost due to the nature of ephemeral server instances. (e.g. when the new version of the bot is deployed, the old server instance may be shut down by the cloud hosting platform).

To address this issue, we give you the Ghost Content feature. In production, your changes are saved to the database which is persisted between deployments. But how do you get these changes back to your bot's codebase? Simple, the botpress cli gives you a special command to pull pending changes on your server for all your bots and server wide files. `./bp pull --url {SERVER_URL} --authToken {YOUR_AUTH_TOKEN} --targetDir {TARGET_DIRECTORY}`

You can also head to the versioning tab of your botpress admin panel at https://your.bp.ai/admin/server/version, the command will be properly formatted for you (including your token) any changes have been made. Just paste it to your shell and the changes will be extracted in the provided target directory. A successful output should look like the following:

![versioning pull](assets/versioning-pull.png)

Notice that without any changes, you will see a **You're all set!** message.

## Workflow

A best practice is to keep the changes of your bots in your prefered Source Control Management tool (e.g Git) and always deploy the master branch in production. Once deployed, you can regularly pull production changes and apply them to your SCM, or revert them at any moment. With this tip you can harness the power of your SCM for branches, merge conflicted files, review changes & create revisions.

Fine, now what if you have a more complex deployment pipeine with a(or multiple) staging environment with pending changes on each enviroment? That's what we'll learn next.

## Pipelines

In this section, we will again use the power of your preferred Source Control Tool (we'll use git in this tutorial) to sync changes between 2 enviroment & promote an enviroment (i.e. promote staging to production).

Given a pipeline with 3 enviroments, **development**, **staging** and **production**. Let's say there are some changes both on production and staging & you want to promote staging to production. What we want to do is the following :

1- to create merge conflict so we can choose what we want in a merge conflict tool.
2- resolve conflicts (i.e merge staging into production)
3- push the results to master so it can be deployed to your production environment.

That simple. Let's do it.

First, create a branch and sync it with the production enviroment

`git checkout master && git checkout -b prod-sync`

`./bp pull --url {PROD_SERVER_URL} --authToken {YOUR_AUTH_TOKEN} --targetDir {TARGET_DIRECTORY}`

`git commit -am 'sync prod'`

Repeat the process with staging env

`git checkout master && git checkout -b staging-sync`

`./bp pull --url {STAGING_SERVER_URL} --authToken {YOUR_AUTH_TOKEN} --targetDir {TARGET_DIRECTORY}`

`git commit -am 'sync staging'`

Then merge the staging changes into the prod changes

`git checkout prod-sync && git merge staging-sync`

This will create a merge conflict, use your prefered merge tool to review the changes & resolve the conflicts. Once that done, you will be able to publish your branch and create a pull request (if your hosted git allows it) and merge it to master. Once your master branch is up to date, you'll be able to publish the changes in production and we're done.

With these quick tips you can now promote any enviroment changes to any stage in your deployment pipeline.
