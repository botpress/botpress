# HIT Looper

## Description

This is a bot that implements the Human In The Loop (HITL) pattern. Talk to this bot as a customer in Telegram. When sending the message `/start_hitl`, the bot will connect you to an agent in Zendesk. The agent will be able to reply to you and send you back to the bot when the conversation is over.

## Usage

1. Create a new bot using the Botpress Dashboard or the Botpress CLI.
2. Install the Telegram and Zendesk integrations using the command `bp add telegram && bp add zendesk`.
3. Build the bot using command `bp build`.
4. Deploy the bot using command `bp deploy`.
5. In the botpress Dashboard, enable and configure the integrations Telegram and Zendesk.
6. Talk to the bot as a customer in Telegram and ask to start a HITL session by sending the message `/start_hitl`.
7. Login to Zendesk and reply back to yourself as an agent.
