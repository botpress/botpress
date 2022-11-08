---
id: api-call
title: API Call
---

--------------------

We developed the Call API skill to help you quickly call an API within your flow. You can then save and use the responses received from the external API in your chatbot's code and flows.

![From Flow Editor](/assets/call-api-skill-flow.png)

## Request Options

Calling an API involves making an HTTP request from Botpress to a named host on a server. The request aims to access a resource on the server. The following are the components of your request through which you will supply information to an API.

### Body

The request body is set in the interface below. Please ensure that your request body adheres to the syntax specified for the API you are calling.

![Main View](/assets/call-api-skill.png)

### Headers

The request headers can be set here and should respect the JSON format.

![Headers](/assets/call-api-skill-headers.png)

## Response

All APIs respond to every request with an HTTP status indicating whether the request was successful. The response typically comes along with a json response which may contain additional information. The Call API skill supports receipt and storage of this response in the following manner.

### Memory

We use [memory](/building-chatbots/memory-&-data-persistence/flow-memory) to save the response given by the API we are calling. By default, Botpress will save the response in `temp.response`, but you can use the memory of your choice according to the use-case.

![Memory](/assets/call-api-skill-memory.png)

The saved response object looks like this:

```json
{
  "body": <Response Body>,
  "status": 200
}
```

### Success / Failure

When a response returns a status code `400` and above, the request will fail and will execute the `On failure` transition. All other status codes will result in success and will execute the `On success` transition.

## Templating

Botpress supports templating in the `body` and the `headers` to access variables stored in [memory](/building-chatbots/memory-&-data-persistence/flow-memory). All `bot`, `user`, `session`, `temp`, and `event` memory types are accessible via templating.

![Template](/assets/call-api-skill-template.png)
