# Zendesk Messaging HITL

## Description

This integration makes Sunshine Conversations (Sunco) available as a channel for Human-in-the-loop on Botpress, integrated with Zendesk. When a user requests to speak with an agent, a conversation will be created in Sunshine Conversations and passed to Zendesk Agent Workspace for agent handling.

## Known Limitations

> **Warning:** Currently this integration cannot be used alongside the Sunco integration (Zendesk Messaging) if both are configured with OAuth for the same Zendesk account. Use the **Manual (API Key)** configuration type if you need to run both integrations simultaneously.

## Configuration

You will need to have Admin access to your **Zendesk Account** to configure this integration. Two configuration methods are available: **OAuth** (recommended) and **Manual**.

### OAuth Configuration (Recommended)

OAuth is the simplest way to connect. Botpress will handle authentication automatically through Zendesk's OAuth flow — no need to create API keys manually.

1. Select **Connect with OAuth** when installing the integration
2. Log in to your Zendesk account and authorize Botpress
3. Botpress will automatically configure the integration using your Zendesk account

### Manual Configuration

Use this option if you prefer to manage your own Sunshine Conversations app credentials, or if you need to run this integration alongside the Sunco integration.

#### Configuration fields

- **App ID**: Your Sunshine Conversations App ID
- **Key ID**: Your Sunshine Conversations Key ID
- **Key Secret**: Your Sunshine Conversations Key Secret

#### How to get your credentials

1. Log in to your [Zendesk Admin Center](https://admin.zendesk.com)
2. Navigate to **Channels** > **Messaging and social** > **Sunshine Conversations**
3. Select your app (or create one) to find the App ID
4. Go to **Settings** > **API Keys** to create a Key ID and Key Secret

## Automatic Setup

When you register this integration using the **Manual** method, it will automatically:

1. Create an integration in your Zendesk Account with the name `botpress-hitl-{webhookId}`
2. Configure the webhook to receive events from Zendesk Messaging
3. Set up the integration to handle messages and agent handoff events

The webhook URL is automatically configured during registration.

## Enabling Multi Conversations

Please enable multi conversations in Zendesk Messaging, you need to configure your Zendesk account settings:

1. Go to your Zendesk Admin Center
2. Navigate to **Channels** > **Messaging and social** > **Manage Settings**
3. Enable **Multi conversations**

When multi conversations is enabled, each new HITL session will create a separate conversation in Zendesk, allowing for better organization and handling of multiple support requests from the same customer.

## Ending Sessions

### Overview

Ending messaging sessions allows you to stop further interaction via messaging without closing tickets. This is useful to end a hitl session so the user can get back to the bot.

Please allow the agent to end sessions for a better hitl experience, otherwise, only the user will be able to do it

1. Go to your Zendesk Admin Center
2. Navigate to **Channels** > **Messaging and social** > **Manage Settings**
3. Enable **Ending messaging sessions**

### Agent Actions

Agents can end messaging sessions at any time through the Zendesk Agent Workspace interface. When a session is ended:

1. The messaging channel for that conversation is closed and user is sent back to the bot
2. The ticket remains open for email follow-up.
3. A new hitl sessions from the customer will create a new ticket
4. The agent's capacity is automatically released
