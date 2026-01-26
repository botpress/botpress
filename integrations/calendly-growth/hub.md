
## What it is
A simply great integration to connect your Calendly account to your Botpress Bot. Send meeting invites to users and receive an event when they schedule directly in your bot. 


## How it works
When enabling the integration, a Webhook Subscription is created for your Calendly account using the provided `Access Token`. This webhook sends an event to the integration when an invitee signs up for one of your events.
The `Schedule Calendly Event` action can be used to create event link. It requires a Conversation Id and Calendly Event URL. It uses the URL to match an event from your Calendly and creates a new link with your Conversation Id embeded inside. This Id is then used to trigger the `Calendly Event`	inside the conversation so that your bot can respond to the event.

`Conversation Id` is a unique identifier for each conversation. You can pass {{event.conversationId}} into this field to embed your id. When receiving a Calendly Event you can use {{event.payload.conversation.id}} in the Advanced Options `Conversation ID` field of the `Calendly Event Trigger`. This will pull the event to the appropriate conversation.

You can see the full integration code at: https://github.com/SimplyGreatBots/Calendly
## Tutorial Video
[![image](https://i.imgur.com/42H34IF.png)](https://youtu.be/0jdsGJhoQfo)

#### Pre-requisites
Receiving events from Calendly requires a `Standard` or higher subscription to have access to webhooks required for this integration.

#### Calendly Setup
1. Go to your [Calendly Integrations Page](https://calendly.com/integrations) and click on `API and Webhooks`.
2. Click on `Generate New Token`, choose a name, and click `Create Token`.
3. After the token is created, copy, and save it in a safe location. You will need in step 3 of the Botpress setup.

#### Botpress Setup
1. Click `Install` on the top right and select your bot.
2. Click the popup that appears to configure your integration.
3. Add your Calendly access token to the `Access Token` field.
4. Enable and save the integration.