# Google Calendar Integration

## Description

The Google Calendar Integration allows you to seamlessly interact with Google Calendar within your Botpress bot. This integration provides various actions to manage calendar events, enhancing the functionality of your bot.

## Actions Supported

The Google Calendar Integration supports the following actions:

- `createEvent`: Create a new event on Google Calendar.
- `listEvents`: Retrieve a list of upcoming events from Google Calendar.
- `updateEvent`: Update an existing event on Google Calendar.
- `deleteEvent`: Delete an event from Google Calendar.

## Installation and Configuration

To set up the Google Calendar Integration for your Botpress bot, follow these steps:

1. **Google Cloud Project Setup**:

   - Create a new project in the [Google Cloud Console](https://console.cloud.google.com/).
   - Enable the Google Calendar API for your project.
   - Create a service account for your project.
   - Create and download the service account's private key JSON file.

2. **Botpress Configuration**:
   - Install the Google Calendar Integration in your Botpress bot.
   - Open the JSON file downloaded earlier and copy paste the `private_key` and `client_email ` values in the configuration fields.
   - Go to your Google Calendar and copy the calendar ID from the calendar url.
   - Add the `client_email` from the JSON file as a user with the access and necessary permissions to the calendar.

## Usage

Once the Google Calendar Integration is configured, you can use it to manage calendar events within your Botpress bot. Here are some common use cases:

- Schedule appointments or events on Google Calendar.
- Retrieve upcoming events and display them to users.
- Update or delete events based on user requests.

The integration provides powerful capabilities to enhance your bot's scheduling and event management functionalities.

## Documentation and Resources

For detailed documentation, API references, and examples, please refer to the integration's README file or the Botpress documentation.

If you encounter any issues or have questions related to the Google Calendar Integration, feel free to reach out to our support team or the Botpress community for assistance.

Start using the Google Calendar Integration to streamline your bot's scheduling and calendar management tasks!
