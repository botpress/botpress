# Zendesk Messaging HITL

## Description

This integration makes Sunshine Conversations (Sunco) available as a channel for Human-in-the-loop on Botpress, integrated with Zendesk. When a user requests to speak with an agent, a conversation will be created in Sunshine Conversations and passed to Zendesk Agent Workspace for agent handling.

## Configuration

You will need to have access to your **Zendesk Account** account to configure this integration.

### Configuration fields on Botpress

- **App ID**: Your Sunshine Conversations App ID
- **Key ID**: Your Sunshine Conversations Key ID
- **Key Secret**: Your Sunshine Conversations Key Secret

### Automatic Setup

When you register this integration, it will automatically:
1. Create a Integration in Zendesk Account with the name `{botId}-hitl`
2. Configure the webhook to receive events from Zendesk Messaging
3. Set up the integration to handle messages and switchboard events

The webhook URL is automatically configured during registration

### Events handled

- **conversation:message**: Receives messages from agents and forwards them to the bot
- **switchboard:releaseControl**: Automatically closes the HITL session when control is released (e.g., when a ticket is closed)

## Features

- Automatic webhook and integration setup
- Seamless handover to Zendesk Agent Workspace
- Automatic HITL session closure when tickets are closed
- Support for conversation transcripts and metadata
- Full message type support (text, image, file, audio, video)
