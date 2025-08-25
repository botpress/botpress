The Google Calendar Integration allows you to seamlessly interact with Google Calendar within your Botpress bot. This integration provides various actions to manage calendar events, enhancing the functionality of your bot.

## Important note

Unfortunately, **automatic configuration is temporarily unavailable**.
We are currently in the process of getting our Google Calendar integration verified by Google. Once this verification is complete, you will be able to use the automatic configuration method to set up the Google Calendar integration with just a few clicks. Until then, you will need to create your own Google Cloud Platform (GCP) Service Account by following the steps outlined in the `Manual configuration using a service account` section below.

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

#### Creating a Google Cloud Platform project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project by clicking the `Select a resource` dropdown in the top navigation bar and selecting `New Project`.
3. Follow the on-screen instructions to create the new project.

#### Enabling the Google Calendar API

1. In the Google Cloud Console, navigate to the `APIs & Services` section.
2. Click on `Library` in the left sidebar.
3. Search for `Google Calendar API` and click on the result.
4. Click the `Enable` button to enable the Google Calendar API for your project.

#### Creating a service account

1. In the Google Cloud Console, navigate to the `IAM & Admin` section.
2. Click on `Service Accounts` in the left sidebar.
3. Click the `Create service account` button.
4. Enter a name for the service account. This should automatically fill the `Service account ID` field.
5. Click `Done` to proceed. There is no need to grant any roles or permissions at this stage.

#### Downloading the service account credentials file

1. In the Google Cloud Console, navigate to the `IAM & Admin` section.
2. Click on `Service Accounts` in the left sidebar.
3. Select the service account you created previously.
4. Click on the `Keys` tab.
5. Click the `Add Key` button and select `JSON`.
6. A JSON file containing the service account credentials will be downloaded to your computer. Save this file in a secure location, as it contains sensitive information. You will need this file to configure the Google Calendar integration in Botpress.

#### Locating your service account email and private key

1. Open the downloaded JSON file in a text editor.
2. Look for the `client_email` field. This is the email address of the service account you created. Copy the email address, excluding the quotation marks. You will need this email address to share your calendar with the service account and to configure the integration in Botpress.
3. Look for the `private_key` field. This is the private key associated with the service account. Copy the private key, excluding the quotation marks. You will need this private key to configure the integration in Botpress.
   > This public key begins with `-----BEGIN PRIVATE KEY-----\n` and ends with `\n-----END PRIVATE KEY-----\n`. You must copy the entire key: everything that is between the quotation marks.

#### Sharing your calendar with the service account

1. Open Google Calendar in your web browser.
2. Find the calendar you want to access on Botpress.
3. Click on the three dots next to the calendar name and select `Settings and sharing`.
4. In the `Shared with` section, click on `Add people`.
5. Enter the service account email address (found in the downloaded JSON file) and select the appropriate permissions: `Make changes to events`.

> **Please note:** your organization may have restrictions on sharing calendars with external users. If you are unable to share the calendar with the service account email address, you may need to use a different account or ask your organization's administrator for help.

#### Locating your calendar ID

1. Open Google Calendar in your web browser.
2. Find the calendar you want to access on Botpress.
3. Click on the three dots next to the calendar name and select `Settings and sharing`.
4. In the `Integrate calendar` section, you will find the _Calendar ID_. You will need this ID to configure the integration in Botpress.

#### Configuring the Google Calendar integration in Botpress

1. Install this integration in your bot with the following configuration:
   - **Calendar ID**: The ID of the Google Calendar to interact with.
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
