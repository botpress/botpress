The Google Calendar Integration allows you to seamlessly interact with Google Calendar within your Botpress bot. This integration provides various actions to manage calendar events, enhancing the functionality of your bot.

## Migrating from version `0.x` to `1.x`

If you are migrating from version `0.x` to `1.x`, please note the following changes:

> The integration now supports both OAuth and service account authentication methods. If you wish to continue using a service account key, you will need to select _Configure manually with a Service Account Key_ in the configuration dropdown menu and reconfigure the integration. See the _Manual configuration using a service account_ section down below for more information.

> When creating or updating calendar events, you can now optionally specify the recurrence and visibility settings for the event. These new fields are also now being returned when listing events.

> When creating or updating events, the ISO 8601 date-time format is now fully supported and it is no longer necessary to input dates as RFC 3339 strings.

## Configuration

### Automatic configuration with OAuth (recommended)

To set up the Google Calendar integration using OAuth, click the authorization button and follow the on-screen instructions to connect your Botpress chatbot to Google Calendar.

When using this configuration mode, a Botpress-managed Google Calendar application will be used to connect to your Google account. However, actions taken by the bot will be attributed to the user who authorized the connection, rather than the application. For this reason, **we do not recommend using personal Google accounts** for this integration. You should set up a service account and use this account to authorize the connection.

Once the connection is established, you must specify the identifier of the calendar you want to interact with. This identifier can be found by navigating to the calendar in Google Calendar and opening the settings for that calendar. Once in the settings, you will find the _Calendar ID_ in the `Integrate calendar` section. This is the value you need to provide in the configuration.

1. Find your Google Calendar ID for the calendar you want to interact with.
2. Authorize the Google Calendar integration by clicking the authorization button.
3. Fill in the **Calendar ID** field and save the configuration.

### Manual configuration using a service account

1. Login to Google Cloud Console and create a new project.
2. Enable Google Calendar API for the project.
3. Create a service account for the project. This integration won't work with any other type of credentials.
4. Download the JSON credentials file and save it somewhere safe.
5. The downloaded JSON file contains a `client_email` field. Share your calendar with this email address to give it access.
   - Please note: your organization may have restrictions on sharing calendars with external users. If you are unable to share the calendar with the service account email, you may need to use a different account or ask your organization's administrator for help.
6. Install this integration in your bot with the following configuration:
   - **Calendar ID**: The ID of the Google Calendar to interact with. This identifier can be found by navigating to the calendar in Google Calendar and opening the settings for that calendar. Once in the settings, you will find the _Calendar ID_ in the `Integrate calendar` section.
   - **Service account private key**: The private key from the Google service account. You can get it from the downloaded JSON file.
   - **Service account email**: The client email from the Google service account. You can get it from the downloaded JSON file.

## Usage

Once the Google Calendar Integration is configured, you can use it to manage calendar events within your Botpress bot. Here are some common use cases:

- Schedule appointments or events on Google Calendar.
- Retrieve upcoming events and display them to users.
- Update or delete events based on user requests.

The integration provides powerful capabilities to enhance your bot's scheduling and event management functionalities.

### Configuring event recurrence

When creating or updating a calendar event, you can specify the recurrence settings for the event. The recurrence settings are defined using the [RFC 5545](https://tools.ietf.org/html/rfc5545) standard, which allows you to define complex recurrence patterns for events. Here are some examples of recurrence rules:

- Repeat every day at the same time: `RRULE:FREQ=DAILY`
- Repeat every day for the next 5 days: `RRULE:FREQ=DAILY;COUNT=5`
- Repeat every week on Monday, Wednesday, and Friday: `RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR`
- Repeat every month on the 15th: `RRULE:FREQ=MONTHLY;BYMONTHDAY=15`
- Repeat every year on January 1st: `RRULE:FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1`
- Repeat on the first Monday of every month: `RRULE:FREQ=MONTHLY;BYDAY=1MO`
- Repeat every 2 weeks on Monday: `RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO`
- Repeat daily until a specific date: `RRULE:FREQ=DAILY;UNTIL=20261231T000000Z`
- Repeat every Monday, except for March 25, 2026: `RRULE:FREQ=WEEKLY;BYDAY=MO;EXDATE=20260325T000000Z`

You can use these recurrence rules to create events with complex repeating patterns. You may also use online RRULE generators to create custom recurrence rules for your events.
