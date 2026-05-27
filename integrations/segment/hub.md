## What It Is

This integration enables you to connect your Botpress bot with Segment Analytics, allowing you to update user profiles, track node views, and custom events directly within your bot's flows.

## How It Works

The integration works by using actions to interact with Segment Analytics. Here's a brief overview of the actions:

1. **Update User Profile**: Updates a user's profile with identifying information such as email and name.
2. **Track Node**: Tracks when a specific node within your bot is triggered.
3. **Track Event**: Tracks custom events with optional properties defined in the payload.

These actions are backed by the Segment Analytics API, utilizing a write key to authenticate requests.

## Integration Features

### Actions

- **Update User Profile**
  - Updates identifying information of a user's profile in Segment Analytics.
  - Inputs: User ID, User Profile (optional JSON string of user metadata)

- **Track Node**
  - Tracks when a node has been triggered within the bot.
  - Inputs: User ID, Node ID

- **Track Event**
  - Tracks a custom event and associated properties in Segment Analytics.
  - Inputs: User ID, Event Name, Event Payload (optional JSON string of event properties)

### Configuration

- **Write Key**: The write key is required to authenticate requests to Segment Analytics. After creating a Source you can generate a Write Key by going to Sources -> API Keys -> Settings -> Write Key

## Setup Instructions

#### Segment Analytics Setup

1. Log into your Segment Analytics dashboard.
2. Create a new Source to receive your Botpress Events
3. Generate a new Write Key using the instructions above.

#### Botpress Setup

1. Click `Install` on the top right and select your bot.
2. Follow the popup instructions to configure your integration.
3. Enter your Segment Analytics write key from the Segment Analytics Setup into the `Write Key` field.
4. Enable the integration to save your settings.
