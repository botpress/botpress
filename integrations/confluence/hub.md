# Integrate your chatbot with Confluence to fetch pages, retrieve all pages, and interact with Confluence content seamlessly

## Configuration

### Automatic configuration with OAuth

<!-- To set up the Confluence integration using OAuth, click the authorization button and follow the on-screen instructions to connect your Botpress chatbot to Confluence.

When configuring your bot with OAuth, you can either log in with your user account or with a user account you created specifically for your bot.
Please keep in mind that if you log in with your user account, the bot actions and interactions will appear as yours.
For most use cases, it is recommended to create a user account specifically for your bot. You will have to grant the bot's user appropriate permissions in Confluence for it to access pages and perform actions. -->

### Manual configuration using API credentials

1. Confluence API token creation
   - Log in to your Confluence account and navigate to the [API token management page](https://id.atlassian.com/manage-profile/security/api-tokens).
   - Generate a new API token and copy it.
2. Confluence Botpress integration configuration
   - Install the Confluence integration in your Botpress bot.
   - Paste the API token copied earlier in the configuration fields, along with your Confluence username and host URL. These credentials will allow your bot to fetch pages and interact with Confluence.
   - Save configuration.

## Limitations

Standard Confluence API limitations apply to the Confluence integration in Botpress. These limitations include rate limits, payload size restrictions, and other constraints imposed by Confluence. Ensure that your chatbot adheres to these limitations to maintain optimal performance and reliability.

More details are available in the [Confluence REST API Documentation](https://dqeveloper.atlassian.com/cloud/confluence/rest/).
