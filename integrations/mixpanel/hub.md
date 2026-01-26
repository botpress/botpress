## What It Is

This integration enables you to connect your Botpress bot with Mixpanel Analytics, allowing you to update user profiles and track custom events directly within your bot's flows.

## How It Works

The integration works by using actions to interact with Mixpanel Analytics. Here's a brief overview of the actions:

1. **Update User Profile**: Updates a user's profile with identifying information such as email and name.
2. **Track Event**: Tracks custom events with optional properties defined in the payload.

These actions are backed by the Mixpanel Analytics API, utilizing a write key to authenticate requests.

## Integration Features

### Actions

- **Update User Profile**
  - Updates identifying information of a user's profile in Mixpanel Analytics.
  - Inputs: User ID, User Profile (optional JSON string of user metadata)

- **Track Event**
  - Tracks a custom event and associated properties in Mixpanel Analytics.
  - Inputs: User ID, Event Name, Event Payload (optional JSON string of event properties)

### Configuration

- **Token**: A project token is required to authenticate requests to Mixpanel Analytics. After creating a Project you can get your token by going to Project Settings -> Overview -> Access Keys -> Project Token.

## Setup Instructions

### Mixpanel Analytics Setup

1. Log into your Mixpanel Analytics dashboard.
2. Create a Mixpanel project.
3. Find your token using the instructions above.

### Botpress Setup

1. Click `Install` on the top right and select your bot.
2. Follow the popup instructions to configure your integration.
3. Enter your Mixpanel Analytics write key from the Mixpanel Analytics Setup into the `token` field.
4. Enable the integration to save your settings.
