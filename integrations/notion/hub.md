## Capabilities

The Notion Integration for Botpress Studio allows you to do the following things:

> The following actions require you to know the Ids of the Notion entities your bot will work with. All notion entities (pages, databases, etc) have and id that can be found in the URL when you visit those in your Notion account in a Browser,or by getting the link by clicking on the "Copy Link" item in the (...) menu. See [Get a Database Id - Notion Developers](https://developers.notion.com/docs/create-a-notion-integration#step-3-save-the-database-id) for more information

### Add Comment to a Discussion

This action allows you to add a comment to an existing discussion. Use this for replying to a comment.

### Add Comment to a Page

You can add page level comments with this action.

### Get a Database

This allows you to get the details of a Database. This is ideally used with the `Add Page to a Database` action. In addition to the response from the Notion API ([Retreive a Database - Notion Developers](https://developers.notion.com/reference/retrieve-a-database)), this action also returns a optimized `structure` property (technically a type decleration) that can be used as an input for an AI task to instruct it to generate a payload for adding or updating a page in a Notion Database based on a user input.

### Add Page to a Database

This action should ideally be used in tandem with `Get a Database` that returns the structure of the Database that you can use to instruct an [AI task](https://botpress.com/docs/cloud/generative-ai/ai-task-card/) to generate a payload. See [Working with Databases - Notion Developers](https://developers.notion.com/docs/working-with-databases) for more info.

### Delete a block

You can delete the following entities:

- a page in a database
- a page
- a block

## Installation and Configuration

### Step 1 - Create Integration

Create a Notion integration [Create an integration - Notion Developers](https://developers.notion.com/docs/create-a-notion-integration)

### Step 2 - Give access to Notion Assets

Give your integration access to all the pages and databases that you want to use with Botpress

### Step 3 - Configure your Bot

Give your integration access to all the pages and databases that you want to use with Botpress. [Share a database with your integration - Notion Developers](https://developers.notion.com/docs/create-a-notion-integration#step-2-share-a-database-with-your-integration)

You need a token to get your newly created Notion Integration _(not the same as Botpress Studio's Notion Integration)_ connected with Botpress Studio:

- `Auth Token` - You'll find this by going to your integration under `https://www.notion.so/my-integrations`. Once you click on your integration, go to the "Secrets" section and find the "Internal Integration Secret" field. Click "Show" then "Copy". Paste the copied token under `Auth Token` field for Notion integration under the "Integrations" tab for your bot.

With that you just need to enable your integration and you can start expanding your Bot's capabilities with Notion.
