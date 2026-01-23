# SendGrid Integration

## What it is

A simply great integration to connect your SendGrid account to your Botpress Bot. Send emails directly from your bot.

## How it works

You can use the Send Email action send emails to one or more recipients. It requires the recipient's email address, sender's email address, subject, and content.

To send to a single email address you can provide a single email string.
To send to multiple email addresses at once you must provide a stringified array.

`Example: workflow.to = JSON.stringify(['emailOne@example.com', 'emailTwo@example.com'])`


You can see the full integration code at: [GitHub - SimplyGreatBots/SendGrid](https://github.com/SimplyGreatBots/SendGrid)

## Pre-requisites

Sending emails with this integration requires a SendGrid account with an API key and authenticated email address.

## SendGrid Setup

1. Go to your SendGrid account and navigate to Settings -> API Keys.
2. Click on Create API Key, choose a name, and select the required permissions.
3. After the API key is created, copy and save it in a safe location. You will need it in step 3 of the Botpress setup.
4. Go to Settings -> Sender Authentication -> Create New Sender.
5. Fill out the required information to verify your email. 

## Botpress Setup

1. Click Install on the top right and select your bot.
2. Click the popup that appears to configure your integration.
3. Add your SendGrid API key to the API Key field.
4. Enable and save the integration.
