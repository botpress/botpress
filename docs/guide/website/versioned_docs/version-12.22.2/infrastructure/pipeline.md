---
id: version-12.22.2-pipelines
title: Bot Pipelines
original_id: pipelines
---

## Overview

**Bot Pipelines** (not to be confused with Development Pipelines) are built on top of the multi-bot capability of Botpress. They allow teams to work on chatbots with multiple **stages** just like they work on software products. Different versions of a chatbot can run and co-exist on various stages. In software development, each team has its way of working with pipelines and reacting to events. Botpress pipelines let you do the same.

![Pipeline](assets/dev-pipeline.png)

Although a typical pipeline would have three stages (e.g., _Development_, _Staging_ and _Production_) where a chatbot goes through all of them, Botpress lets you define your stages and customize how they interact.

## Prerequisite

Pipelines are a Botpress Enterprise feature, so make sure you're running the enterprise edition with a valid license key. If you don't have a license key or don't know how to activate it, please follow [this guide](/docs/pro/licensing).

## Concepts

### Stage

As mentioned earlier, a Pipeline is simply a list of stages a chatbot needs to (or can) go through. A stage is defined using json :

```json
{
  "id": "dev",
  "label": "Development",
  "action": "promote_copy"
}
```

Properties are self-explanatory except for action, which is defined. In a pipeline definition, the order of stages follows the order in the array `(1st stage === index 0).`

### Stage Actions
A stage action defines how the pipeline system behaves when a chatbot is ready for promotion from one stage to another. Two actions are currently available `promote_move`, which moves the chatbot from current to next stage, and `promote_copy` creates an exact copy of the chatbot before being promoted to the next stage. The latter is useful when you want to keep the work in progress (i.e., Dev stage) version of your chatbot and send versions along the pipeline.

### Chatbot Pipeline Status

Each chatbot now defines a `pipeline_status` object in its `bot.config.json` file. The object structure goes as follows :

```js
{
  /*
    ... other chatbot config fields
  */
  "pipeline_status": {
    "current_stage": {
      "id": "dev", // id of the current stage
      "promoted_on": "2019-04-03T01:08:46.999Z", // date the chatbot has moved to this stage
      "promoted_by": "user@botpress.com" //email of the user who changed the stage of the bot
    },
    "stage_request": {
      "id": "staging", //id of the desired stage
      "requested_on": "2019-04-04T13:16:32.107Z",
      "requested_by": "user2@botpress.com" //email of the user who asked for a stage change
    }
  }
}
```

At the moment, only the current_stage will be interesting for you. We will learn more on `stage_request` in the [available hooks section](#available-hooks)

## Usage

If you tried Botpress, you've already been using the Pipeline feature; you just don't know it. By default, every Botpress deployment defines a single-stage pipeline, even running on the community edition. In the next sections we will show how to use different pipeline components and build a standard **Dev** ==> **Staging** ==> **Prod**.

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

> **Note**: Botpress allows pipelines with a maximum of four stages. More than this will result in suboptimal performance of Botpress.

### Graphical Interface

After defining your pipeline, restart your server and open your admin panel and create a bot. You should then see a pipeline like the following :

![Pipeline](assets/pipeline.png)
Go ahead and pick the `promote to next stage` action. You'll see a **copy** of the chatbot appear in the Staging environment. (`promote_copy` in the stage definition)
![Pipeline Promote](assets/pipeline_promote.png)
![Pipeline Promote copy](assets/pipeline_promoted_copy.png)
This time, pick the same action on the Staging bot. You'll notice the chatbot will **move** to Production. (`promote_move` in the stage definition)
![Pipeline Promote move](assets/pipeline_promoted_move.png)

Want to lock a chatbot in a particular stage or change its name along the pipeline? You can do so using [available hooks](#available-hooks)

### API
Behind the scenes, the UI makes an authenticated call to the admin API. If you want to promote a chatbot by API, you can easily do so

```bash
curl -X POST http://your.botpress.deployment/api/v1/admin/bots/{_YOUR_BOT_ID_}/stage -H="Authorization:Bearer {_YOUR_AUTH_TOKEN_}"
```

### Available Hooks

Hooks are vital components to customize the pipeline feature to your needs fully. If you don't know about hooks, read [the docs](../main/code#hooks) right away.
So far, we haven't customized anything on the pipeline feature, and we didn't use or even see the `stage_request` property in the chatbot configs. If we want to check if the user has the right to change the stage of the bot, then rename it, give it a custom id and lock it,  we would use the `on_stage_request` hook.

The hook will be called with the following arguments: **bp** (botpress sdk), **bot** (content of bot.config.json) , **users** (users in the workspace), **pipeline** (your pipeline definition), **hookResult** (object with a `actions` property).

```js
//function (bp, bot, users, pipeline, hookResult) {
const request_user = users.find(u => u.email == bot.pipeline_status.stage_request.requested_by)
if (!request_user || request_user.role !== 'YOUR_TARGET_ROLE') {
  /*
  we want to keep the chatbot in the current stage and until another user with the correct role promotes it
  here would go an API call to your 3rd party notification service
  */
  hookResult.actions = []
  return
}

/*
hookResult contains the action in the stage definition by default, the promoted chatbot (copied or moved) will have the following properties
*/
bot.name = 'new chatbot name'
bot.id = 'new-bot-id='
bot.locked = true
// }
```

That's it. Now, what if we want to call some 3rd party email service to notify all workspace users once a chatbot has changed stage? There's a hook for that: `after_stage_changed`.

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
