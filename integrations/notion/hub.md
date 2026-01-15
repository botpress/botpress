The Notion Integration for Botpress Studio allows you to do the following things:

## Migrating from version `2.x` to `3.x`

Version `3.x` of the Notion integration brings a lot of features to the table. Here is a summary of the changes coming to Notion:

- Upgraded to Notion API version **2025-09-03**
- Page interactions: Get Page, Get Page Content, Append Blocks to Page, Update Page Properties
- Search by Title
- Comment created Event
- Consolidate comment actions into one action - `Add Comment`

Another change that the update brings is new manual configuration. It now asks for:

- **Internal Integration Secret (required)**: Same as API Token but changed the name to match what is found in Notion's integration's page.
- **Webhook Verification Secret**: This is used to verify webhook events. Can be found in the bot logs when configuring the webhooks.

## Migrating from version `0.x` or `1.x` to `2.x`

Version `2.0` of the Notion integration adds OAuth support, which is now the default configuration option.

If you previously created a Notion integration in the Notion developer portal and wish to keep using this integration, please select the manual configuration option and follow the instructions below.

Otherwise, select the automatic configuration option and click the authorization button, then follow the on-screen instructions to connect your Botpress chatbot to Notion.

## Configuration

### Automatic configuration with OAuth (recommended)

This is the simplest way to set up the integration. To set up the Notion integration using OAuth, click the authorization button and follow the on-screen instructions to connect your Botpress chatbot to Notion. This method is recommended as it simplifies the configuration process and ensures secure communication between your chatbot and Notion.

When using this configuration mode, a Botpress-managed Notion application will be used to connect to your Notion account. Actions taken by the bot will be attributed to this application, not your personal Notion account.

**Note:** Ensure that you have chosen the correct workspace which can be found on the top right during OAuth.

### Manual configuration with a custom Notion integration

#### Step 1 - Create Integration

Create a Notion integration [Create an integration - Notion Developers](https://developers.notion.com/docs/create-a-notion-integration)

#### Step 2 - Give access to Notion Assets

Give your integration access to all the pages and databases that you want to use with Botpress

#### Step 3 - Configure your Bot

You need a token to get your newly created Notion Integration _(not the same as Botpress Studio's Notion Integration)_ connected with Botpress Studio:

- `Internal Integration Secret` - You'll find this by going to your integration under `https://www.notion.so/my-integrations`. Once you click on your integration, under the "Configuration" tab, find the "Internal Integration Secret" field. Click "Show" then "Copy". Paste the copied token under `Internal Integration Secret` field for Notion integration under the "Integrations" tab for your bot.

With that you just need to enable your integration and you can start expanding your Bot's capabilities with Notion.

#### Step 4 - Setup Webhooks (optional)

After saving Step 3 configuration, copy the Botpress integration webhook URL. In your Notion integration's Webhooks tab, paste it in `Webhook URL` and click `verify`. Copy the secret from your Bot logs and paste it back in the verification field. Then add this secret to the `Webhook Verification Secret` field in your Botpress Notion integration configuration to validate webhook events.
