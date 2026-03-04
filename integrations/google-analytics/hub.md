## What It Is

This integration enables you to connect your Botpress bot with Google Analytics, allowing you to update user profiles, track node views, and custom events directly within your bot's flows.

## How It Works

The integration works by using actions to interact with Google Analytics via the Measurement Protocol. Here's a brief overview of the actions:

1. **Update User Profile**: Sends user profile updates to Google Analytics.
2. **Track Node**: Tracks when a specific node within your bot is triggered, sending event data to Google Analytics.
3. **Track Event**: Sends custom event data to Google Analytics, including optional properties defined in the payload.

These actions utilize Google Analytics Measurement ID and an API Secret for secure data transmission.

## Integration Features

### Actions

- **Update User Profile**
  - Sends updates to user profile information to Google Analytics.
  - Inputs: User ID, User Profile (optional JSON string of user metadata)

- **Track Node**
  - Sends tracking data for node activation within the bot to Google Analytics.
  - Inputs: User ID, Node ID

- **Track Event**
  - Sends data for a custom event to Google Analytics.
  - Inputs: User ID, Event Name, Event Payload (optional JSON string of event properties)

### Configuration

- **Measurement ID**: This ID is required to send data to Google Analytics. You can find this ID in your Google Analytics dashboard under Admin > Data Streams.
- **API Secret**: Used to secure data transmission. Can be obtained from the same section as the Measurement ID under Measurement Protocol API secrets.

## Setup Instructions

### Google Analytics Setup

1. Log into your Google Analytics dashboard.
2. Create or select an existing GA4 property.
3. Configure or check your data stream to obtain the Measurement ID and API Secret.

### Botpress Setup

1. Click `Install` on the top right and select your bot.
2. Follow the popup instructions to configure your integration.
3. Enter your Google Analytics Measurement ID and, if using, the API Secret into the appropriate fields.
4. Enable the integration to save your settings.
