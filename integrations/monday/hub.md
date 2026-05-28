# Monday Integration

`@botpresshub/monday` is a Botpress integration that integrates with Monday.com, enabling your bots to create Monday.com items.

## Configuration

This integration connects to Monday.com with OAuth by default. You can also select manual configuration and provide a personal access token if you prefer to configure access manually.

### Monday

You will need to identify the Board IDs of the Monday.com boards you would like your bot to interact with.

#### OAuth

Use the authorization button in Botpress to connect your Monday.com account. During the OAuth flow, Monday will ask you to approve access for this integration.

#### Personal access token

If you prefer manual configuration, refer to the [Authentication Guide](https://developer.monday.com/api-reference/docs/authentication#get-your-token) in the Monday documentation to learn how to acquire your token.

#### Board ID

In order to find your Board ID, log into Monday and navigate to your Board. Then, inspect the URL in your address bar. See the following example:

```
https://<your-workspace-id>.monday.com/boards/9012345678
```

In the URL provided above, the Board ID would be `9012345678`. Keep this (and any other relevant board IDs) around for when configure actions using the Botpress integration.

### Botpress

1. Install the Monday integration in your Botpress bot.
2. Use the default OAuth configuration and click the authorization button to complete the OAuth flow.
3. To configure manually, select **Manual Configuration** and paste your Monday.com personal access token.
4. Save configuration.
