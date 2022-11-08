---
id: converse-api
title: Converse API
---

---

The Converse API skill helps you quickly call an API within your flow. You can then save and use the responses received from the external API in your chatbot's code and flows.

## Request Options

Calling an API involves making an HTTP request from Botpress to a named host on a server. The request aims to access a resource on the server. The following are the components of your request through which you will supply information to an API.

### Body

The request body is set in the interface below. Please ensure that your request body adheres to the specified syntax for the API you are calling.

### Headers

The request headers can be set here and should respect the JSON format.

## Response

All APIs respond to every request with an HTTP status indicating whether the request was successful. The response typically comes along with a JSON response which may contain additional information. The Call API skill supports receipt and storage of this response in the following manner.

### Memory

We use [memory](/building-chatbots/memory-&-data-persistence/flow-memory) to save the response given by the API we are calling. By default, Botpress will save the response in `temp.response`, but you can use the memory of your choice according to the use-case.

The saved response object looks like this:

```json
{
  "body": <Response Body>,
  "status": 200
}
```

### Success / Failure

When a response returns a status code `400` and above, the request will fail and execute the `On failure` transition. All other status codes will result in success and execute the `On success` transition.

## Templating

Botpress supports templating in the `body` and the `headers` to access variables stored in [memory](/building-chatbots/memory-&-data-persistence/flow-memory). All `bot`, `user`, `session`, `temp`, and `event` memory types are accessible via templating.

## Debug API

There's also a secured route that requires authentication to Botpress to consume this API. Using this route, you can request more data to be included in your response using the `include` query params separated by commas.

### JWT Token

To access this route, you need a JWT token. This requirement is in place because sensitive information destined for the chatbot back-end user is accessible via this route. For example, you can access the chatbot's decision logic.

#### Request

Here is a sample request using cURL to get this token:

```js
curl --location --request POST 'http://<your.botpress.server.com>/api/v1/auth/login/basic/default' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "<YOUR-EMAIL>",
    "password": "<YOUR-PASSWORD>"
}'
```

#### Response

In the response, you can find the JWT token and its expiration. The expiration can be configured globally using the `jwtToken.duration` field in the `botpress.config.json` file. This duration will apply to all generated JWT tokens (this applies to all users logging into Botpress).

The response body from the above request will look like this:

```json
{
  "status": "success",
  "message": "Login successful",
  "payload": {
    "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWtsoiwic3RyYXRlZ3kiOiJkZWZhdWx0IiwidG9rZW5WZXJzaW9uIjoxLCJpc1N1cGVyQWRtaW4iOnRydWUsImlhdCI6MTYxODU3Mjk1MCwiZXhwIjoxNjE4NTc2NTUwLCJhsdwiOiJjb2xsYWJvcmF0b3JzIn0.urYZ5A8yXH3XqzSmu7GmImufSgZ0Nx6HknzuidGWnRs",
    "exp": 3600000
  }
}
```

## API Request

### Headers

To call the Converse API on the `/secured` path, you will need to include a `Content-Type` and an `Authorization` header in the POST request as follows:

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
```

Where {token} is the JWT token provided by Botpress as described above.

### Request URL

When calling the debug API, you can get the following options in addition to the standard response.

- **nlu**: the output of Botpress NLU
- **state**: the state object of the user conversation
- **suggestions**: the reply suggestions made by the modules
- **decision**: the final decision made by the Decision Engine

A sample request URL is:

```json
POST /api/v1/bots/{botId}/converse/{userId}/secured?include=nlu,state,suggestions,decision

{
   "type": "text",
   "text": "<text here>",
   "includedContexts": ["global"], // optional, for NLU context
   "metadata": {} // optional, useful to send additional data for custom hooks
}
```

## API Response

Below is a sample of the response given by our support bot at Botpress when it's the first time you chat with it using the converse API with all debug options included.

```json
{
  "responses": [
    {
      "type": "typing",
      "value": true
    },
    {
      "type": "text",
      "markdown": true,
      "text": "Hey there, welcome to **Botpress Support**!"
    }
  ],
  "nlu": {
    "entities": [],
    "language": "n/a",
    "ambiguous": false,
    "slots": {},
    "intent": {
      "name": "none",
      "confidence": 1,
      "context": "global"
    },
    "intents": [],
    "errored": false,
    "includedContexts": ["global"],
    "ms": 0
  },
  "suggestions": [],
  "state": {
    "__stacktrace": [
      {
        "flow": "main.flow.json",
        "node": "entry"
      },
      {
        "flow": "main.flow.json",
        "node": "node-aedb"
      }
    ],
    "user": {
      "0": "{",
      "1": "}"
    },
    "context": {},
    "session": {
      "lastMessages": [
        {
          "eventId": "2614565289899183",
          "incomingPreview": "Hie",
          "replyConfidence": 1,
          "replySource": "dialogManager",
          "replyDate": "2021-04-29T15:43:47.061Z",
          "replyPreview": "#!builtin_text-VahTGK"
        }
      ],
      "workflows": {},
      "slots": {}
    },
    "temp": {}
  },
  "decision": {
    "decision": {
      "reason": "no suggestion matched",
      "status": "elected"
    },
    "confidence": 1,
    "payloads": [],
    "source": "decisionEngine",
    "sourceDetails": "execute default flow"
  }
}
```

## Caveats

Please note that for now, this API can't:

- Be used to receive proactive messages (messages initiated by the bot instead of the user);
- Be disabled, throttled, or restricted.
