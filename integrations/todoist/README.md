# Description

Integrate your chatbot with Todoist to create and modify tasks, post comments, and more.

# Installation and configuration

Follow these instructions to set up Todoist integration for your Botpress bot.

If you are authenticating your Botpress bot with OAuth, follow these steps:

1. Botpress Todoist App installation.
   - Install the Botpress Todoist integration in [Todoist](https://app.todoist.com/app/settings/integrations/browse).
2. Todoist Botpress integration configuration
   - Install the Todoist integration in your Botpress bot.
   - Click on the authorization button.
   - When redirected, agree with the permissions given to the bot by Todoist and either:
     - Log in with your user account if you want the bot actions and comments to appear as yours;
     - Log in with a user account you created for your bot specifically. You will have to invite the bot's user to a shared project for it to be able to post comment, do actions, etc.

If you wish to connect your bot with your personnal API token, follow these steps

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
