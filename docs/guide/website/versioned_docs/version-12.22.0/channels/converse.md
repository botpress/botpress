---
id: version-12.22.0-converse
title: Converse API
original_id: converse
---

The Converse API is an easy way to integrate Botpress with any application or any other channel.

## Public API

The Public API allows you to interact with your chatbot and get an answer synchronously. In other words, you can hold a 'conversation' with your chatbot using the converse API. The only difference is that responses are delivered to the calling application as JSON and not through a channel with a GUI.

### Request Header

To 'speak' with your chatbot via the converse API, make a call with the HTTP header `Content-Type` set to `application/json`)

### Request URL
Make a post request to the converse API. below is an example of the request format
```json
POST <your-bot-url.com>/api/v1/bots/{botId}/converse/{userId}
```
 -Replace **userId** with any unique string to represent a user chatting with your chatbot (**botId**).
 -For **botId**, go to `/data/bots/BOTNAME`, then open the `bot.config.json` file where the last two lines will specify bot id.

### Request Body
In the request body, place the message you are sending to your chatbot as a JSON object.
```json
{
  "type": "text",
  "text": "Google Stock Price"
}
```

### Request Response
The response you get from this API call is the bot's response to this message in the website embedded (or any other) channel. Below is a typical response.
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
            "text": "NASDAQ: GOOGL**2,385.50 USD** Get stock recommendations [here](http:somesite.com) "
        }
    ]
}
```

## Debug API
There's also a secured route (requires authentication to Botpress to consume this API). Using this route, you can request more data to be included in your response using the `include` query params separated by commas.

### JWT Token
To access this route, you need a jwt token. This requirement is in place because sensitive information destined for the chatbot back-end user is accessible via this route. For example, you can access the chatbot's decision logic.  

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
In the response, you can find the JWT token and the expiration for this token. The expiration can be configured globally using the `jwtToken.duration` field in the botpress.config.json file. This duration will apply to all generated JWT tokens (this applies to all users logging into Botpress).

The response body from the above request will look like this:
```json
{
  "status":"success",
  "message":"Login successful",
  "payload":
    {
      "jwt":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWtsoiwic3RyYXRlZ3kiOiJkZWZhdWx0IiwidG9rZW5WZXJzaW9uIjoxLCJpc1N1cGVyQWRtaW4iOnRydWUsImlhdCI6MTYxODU3Mjk1MCwiZXhwIjoxNjE4NTc2NTUwLCJhsdwiOiJjb2xsYWJvcmF0b3JzIn0.urYZ5A8yXH3XqzSmu7GmImufSgZ0Nx6HknzuidGWnRs",
      "exp":3600000
      }
  }
```

### API Request

#### Headers
To call the Converse API on the /secured path, you will need to include a Content-Type and an Authorization header in the POST request as follows:
```json
{
"Content-Type" : "application/json",
"Authorization": "Bearer {token}"
}
```
Where {token} is the JWT token provided by Botpress as described above.

#### Request URL
When calling the debug API, it is possible to get the following options in addition to the standard response.

- **nlu**: The output of Botpress NLU
- **state**: The state object of the user conversation
- **suggestions**: The reply suggestions made by the modules
- **decision**: The final decision made by the Decision Engine

A sample request URL is as follows:
```json
POST /api/v1/bots/{botId}/converse/{userId}/secured?include=nlu,state,suggestions,decision
```
### API Response
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
        "includedContexts": [
            "global"
        ],
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

- Be used to receive proactive messages (messages initiated by the bot instead of the user)
- Be disabled, throttled, or restricted
