Integrate your chatbot with Todoist to create and modify tasks, post comments, and more.

## Migrating from version `0.x` to `1.x`

If you are migrating from version `0.x` to `1.x`, please note the following breaking changes:

> The "Task Create" action has been replaced with the "Create New Task" action.

## Configuration

### Automatic configuration with OAuth

To set up the Todoist integration using OAuth, click the authorization button and follow the on-screen instructions to connect your Botpress chatbot to Todoist.

When configuring your bot with OAuth, you can either log in with your user account or with a user account you created specifically for your bot.
Please keep in mind that if you log in with your user account, the bot actions and comments will appear as yours.
For most use cases, it is recommended to create a user account specifically for your bot. You will have to invite the bot's user to a shared project for it to be able to post comment, do actions, etc.

### Manual configuration using a personal API token

1. Todoist App creation
   - Create an app in the [App Management page](https://developer.todoist.com/appconsole.html).
   - Copy your user's personnal API token or generate a test token in the App Management page.
2. Todoist Botpress integration configuration
   - Install the Todoist integration in your Botpress bot.
   - Paste the API token copied earlier in the configuration fields. This is the token your bot will use to post comments, update or create tasks, etc.
   - Save configuration.
   - Copy the Webhook URL of your bot.
3. Todoist App Webhook configuration
   - Go in the App Management page of your app on Todoist.
   - Make sure the Webhooks events are activated. Follow [these instructions](https://developer.todoist.com/sync/v9/#webhooks) provided by Todoist to do so.
   - Paste the Webhook URL copied earlier in the _Webhook callback URL_ field.
   - Check the following _Watched Events_:
     - _item:added_;
     - _item:updated_;
     - _item:completed_;
     - _note:added_.
   - Save the Webhook configuration.

## Limitations

Standard Todoist API limitations apply to the Todoist integration in Botpress. These limitations include rate limits, payload size restrictions, and other constraints imposed by Todoist. Ensure that your chatbot adheres to these limitations to maintain optimal performance and reliability.

More details are available in the [Todoist Developer Documentation](https://developer.todoist.com/rest/v2/#request-limits).
