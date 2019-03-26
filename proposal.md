**Remove this file after implementation**

# Pipelines

The idea is simple, we keep things prety much as they are, we add a couple of admin routes and a simple pipeline.json config file in which one could define its desired pipeline. Here are the proposed changes.

Pipelines can be enabled or disabled.

### pipeline.json

most of the pipeline config will reside here

```json
{}
```

A bot will flow from stage to stage by following the index in the array (1st stage === idx 0). By default a bot is only editable in the 1st stage (idx 0 in the pipeline array). To define in which pipeline stage a bot is, we simply need to add a "stage" property in the `bot.config.json` file. Each step could be defined as 'persistent' or not. This means that a persistent stage will stay available even when a bot has passed to the next stage. (a typical usage for this would be a staging stage.)

### Stage promotion

#### usage

In addition to this, to submit a bot for 'promotion' and to actually promote a bot to a subsequent stage we need a route

`POST /admin/bots/{id}/stage`
body :

```
{
 stage: string //can be ommited, will use next stage by default
}
```

If the user has admin or super admin right, the bot can be promoted to next stage directly. If not, the pipeline webhook will be called (more on that in the next section). The bot stage is then "sumitted:{stage}" (marked as pending).

Note: a bot _in any other stage than stage-0_ (call it dev) will be readonly
Note: a bot _in any other stage than stage-last_ (call it prod) will be private

#### implementation

Technically a bot promoted from stage 1 to be a bot in different stage is simply duplicated. The copy will be given revesioned id : `{botId}-2019-03-26-{stageName}`. If the prev stage is persistent, we keep the original copy in place otherwise we don't.

### pipeline webhook

notice the webhook_url in the pipeline.json. This webhook will be called in 2 cases :

1- the bot has been sumbited for stage promotion by a non admin user, payload could look like

```json
{
  "type": "stage_promotion_request",
  "botId": "{botId}"
}
```

2- the bot has progressed from stage x to stage y, payload be like:

```json
{
  "type": "stage_promotion",
  "botId": "{botId}"
}
```
