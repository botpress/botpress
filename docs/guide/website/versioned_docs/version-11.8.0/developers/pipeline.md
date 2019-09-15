---
id: version-11.8.0-pipelines
title: Bot Pipeline
original_id: pipelines
---

## Overview

Bot pipelines are built on top of the multi-bot capability of Botpress. They allow teams to work on bots with multiple **stages** the same way others would work on software products. Different versions of a bot can run and co-exist on different stages. In software development, each team has its own way of working with pipelines and reacting to events along the pipeline, Botpress pipelines let you do the same.

Although a typical pipeline would have 3 stages (e.g: _Development_, _Staging_ and _Production_) where a bot goes through all of them. Botpress lets you define your own stages and customize how they interact.

## Prerequisite

Pipelines is a Botpress pro feature, so make you're running pro with a valid license key. If you don't have a license key or don't know how activate it, please follow [this guide](/docs/pro/licensing).

## Concepts

### Stage

As stated above, a Pipeline is simply a list of stages a bot needs to (or can) go through. A stage is defined as a simple json :

```json
{
  "id": "dev",
  "label": "Development",
  "action": "promote_copy"
}
```

Properties are self explanatory except action which is defined. In a pipeline definition, the order of stages is defined by the order it appears in the array `(1st stage === idx 0)`

### Stage Actions

A stage action defines how the pipeline system behaves when a bot is set for promotion (i.e go from one stage to another). Currently 2 actions are available `promote_move` which simply moves the bot from current to next stage and `promote_copy` which creates an exact copy of the bot before being promoted to next stage. The latter is usefull when you want keep a work in progress (i.e Dev stage) version of your bot and send versions along the pipeline.

### Bot Pipeline Status

Each bot now defines a `pipeline_status` object in its `bot.config.json` file. The object structure goes as follows :

```js
{
  /*
    ... other bot config fields
  */
  "pipeline_status": {
    "current_stage": {
      "id": "dev", // id of the current stage
      "promoted_on": "2019-04-03T01:08:46.999Z", // date the bot has moved to this stage
      "promoted_by": "user@botpress.io" //email of the user who changed the stage of the bot
    },
    "stage_request": {
      "id": "staging", //id of the desired stage
      "requested_on": "2019-04-04T13:16:32.107Z",
      "requested_by": "user2@botpress.io" //email of the user who asked for a stage change
    }
  }
}
```

At the moment, only the current_stage will be interresting for you. We will learn more on `stage_request` in the [available hooks section](/docs/developers/pipelines#available-hooks)

## Usage

If you tried Botpress, you've already been using the Pipeline feature, you just don't know it. By default, every Botpress deployment defines a single stage pipeline, even running on the community edition. In the next sections we will show how to use different pipeline components and build a standard **Dev** ==> **Staging** ==> **Prod**.

### Configuration

To define your pipeline, open the `workspaces.json` file and edit the pipeline property.

```js
{
  /*
  ...other workspace property
  */
  "pipeline" : [
    {
      "id": "dev",
      "label": "Development",
      "action": "promote_copy"
    },
    {
      "id": "staging",
      "label": "Staging",
      "action": "promote_move" //for demonstration purposes
    },
    {
      "id": "prod",
      "label": "Production",
      "action": "noop"
    }
  ]
}
```

This simple configuration will activate the pipeline feature.

> **Note**: Botpress allows pipelines of maximum 4 stages, more than this will result in a suboptimal usage of Botpress.

### Graphical Interface

After defining your pipeline, restart your server and open your admin panel and create a bot. You should then see a pipeline like the following :

![Pipeline](assets/pipeline.png)
Go ahead an pick the `promote to next stage` action. You'll see a **copy** of the bot appear in the Staging environment. (`promote_copy` in the stage definition)
![Pipeline Promote](assets/pipeline_promote.png)
![Pipeline Promote copy](assets/pipeline_promoted_copy.png)
This time, pick the same action on the Staging bot, you'll notice the bot will **move** to Production. (`promote_move` in the stage definition)
![Pipeline Promote move](assets/pipeline_promoted_move.png)

Want to lock a bot in a particular stage or change it's name along the pipeline ? You can do so using [available hooks](/docs/developers/pipelines#available-hooks)

### API

Behind the scene, the UI simply makes an authenticated call to the admin api. If you want to promote a bot by api you can easily do so

```bash
curl -X POST http://your.botpress.deployment/api/v1/admin/bots/{_YOUR_BOT_ID_}/stage -H="Authorization:Bearer {_YOUR_AUTH_TOKEN_}"
```

### Available Hooks

Hooks are key components to fully customize the pipeline feature to your needs. If you don't know about hooks, go read [the docs](/docs/build/code#hooks) right away.
Until now, we didn't customize anything of the pipeline feature and we didn't use or even see the `stage_request` property in the bot configs. Say that we want to check if the user has the right to change the stage of the bot, then rename it, give it custom id and lock it. For this we would use the `on_stage_request` hook.

The hook will be called with the following arguments: **bp** (botpress sdk), **bot** (content of bot.config.json) , **users** (users in the workspace), **pipeline** (your pipeline definition), **hookResult** (object with a `actions` property).

```js
//function (bp, bot, users, pipeline, hookResult) {
const request_user = users.find(u => u.email == bot.pipeline_status.stage_request.requested_by)
if (!request_user || request_user.role !== 'YOUR_TARGET_ROLE') {
  /*
  we want to keep the bot in the current stage and until another user with the right role promotes it
  here would go an api call to your 3rd party notification service
  */
  hookResult.actions = []
  return
}

/*
hookResult contains the action in the stage definition by default, the promoted bot (copied or moved) will have the following properties
*/
bot.name = 'new bot name'
bot.id = 'new-bot-id='
bot.locked = true
// }
```

That's it. Now what if we want to call some 3rd party email service to notify all workspace users once a bot has changed stage? There's a hook for that: `after_stage_changed`.

```js
//function (bp, previousBotConfig, bot, users, pipeline) {
const from = previousBotConfig.pipeline_status.current_stage.label
const to = bot.pipeline_status.current_stage.label

Promise.all(
  users.map(u => {
    return axios.post('/your-email-service-api', {
      toEmail: u.email
      message: `bot: ${previousBotConfig.id} went from stage ${from} to ${to}`
    })
  })
).then(() => {
  //done
})
//}
```

For another example, see pre-built hooks in your global/hooks folder.
