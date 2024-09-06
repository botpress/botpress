# Description
Integrate your chatbot with Todoist to create and modify tasks, post comments, and more.

# Installation and configuration

Follow these steps to set up Todoist integration for your Botpress bot:

1. **Todoist App creation**
    - Create an app in the [App Management page](https://developer.todoist.com/appconsole.html)
    - Copy your user's API token (Personnal Access Token or PAT) or generate a test token in the App Management page of your app if you don't want to authenticate using OAuth2
2. **Todoist Botpress integration configuration**
    - Install the Todoist integration in your Botpress bot
    - If you use a PAT or a test token, follow these steps: 
        - Paste the API token copied earlier in the configuration fields. This is the token your bot will use to post comments, update or create tasks, etc
        - Save configuration
        - Copy the Webhook URL of your bot
    - If you want to use OAuth2 to authenticate, follow these steps:
        - Click on the authorization button
        - When redirected, agree with the permissions given to the bot by Todoist and either: 
            - Log in with your user account if you want the bot actions and comments to appear as yours
            - Log in with a user account you created for your bot specifically. You will have to invite the bot's user to a shared project for it to be able to post comment, do actions, etc.
3. **Todoist App Webhook configuration**
    - Go in the App Management page of your app on Todoist.
    - Make sure the Webhooks events are activated if the App is used with your personnal account. Follow [these instructions](https://developer.todoist.com/sync/v9/#webhooks) provided by Todoist.
    - Paste the Webhook URL copied earlier in the *Webhook callback URL* field or use the following URLs if you authenticated with OAuth2:
        - OAuth redirect URL: https://webhook.botpress.cloud/oauth
        - Webhook callback URL: https://webhook.botpress.cloud/integration/global/sebastien_poitras/botpress-todoist
    - Check the following *Watched Events*:
        - *item:added*
        - *item:updated*
        - *item:completed*
        - *note:added*
    - Save the Webhook configuration.
