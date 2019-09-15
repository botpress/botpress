---
id: skill-call-api
title: How to use Call API Skill
---

## Overview

The Call API skill is meant to help the users to easily call an API within their flow.

![From Flow Editor](assets/call-api-skill-flow.png)

## Request Options

### Body

The request body can be set here.

![Main View](assets/call-api-skill.png)

### Headers

The request headers can be set here and should respect the JSON format.

![Headers](assets/call-api-skill-headers.png)

## Response

### Memory

To save the response, we use [Memory](../main/memory). By default the response will be saved in `temp.response`, but you can use the memory of your choice.

![Memory](assets/call-api-skill-memory.png)

The saved response object should look like this:

```json
{
  "body": <Response Body>,
  "status": 200
}
```

### Success / Failure

When a response return a status code `400` and above, the request will result in a failure and will execute the `On failure` transition. All other status codes will result in a success and will execute the `On success` transition.

## Templating

Templating is supported in the `body` and the `headers` to get access to your variables stored in [Memory](../main/memory). All `bot`, `user`, `session`, `temp`, `event` are accessible via templating.

![Template](assets/call-api-skill-template.png)
