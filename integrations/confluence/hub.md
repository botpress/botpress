@botpresshub/confluence is a Botpress module that integrates seamlessly with Confluence, enabling your conversational bots to interact with Confluence pages and content. It allows bots to fetch, read, create, update, and delete pages or other content in Confluence using its REST API.

## Configuration

### Setup and Configuration

1. Confluence API token creation
   - Log in to your Confluence account and navigate to the [API token management page](https://id.atlassian.com/manage-profile/security/api-tokens).
   - Generate a new API token and copy it.
2. Confluence Botpress integration configuration
   - Install the Confluence integration in your Botpress bot.
   - Paste the API token copied earlier in the configuration fields, along with your Confluence username and host URL. These credentials will allow your bot to fetch pages and interact with Confluence.
   - Save configuration.

## Limitations

Standard Confluence API limitations apply to the Confluence integration in Botpress. These limitations include rate limits, payload size restrictions, and other constraints imposed by Confluence. Ensure that your chatbot adheres to these limitations to maintain optimal performance and reliability.

More details are available in the [Confluence REST API Documentation](https://developer.atlassian.com/cloud/confluence/rest/).
