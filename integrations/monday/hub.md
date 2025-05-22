# Monday Integration

`@botpresshub/monday` is a Botpress integration that integrates with Monday.com, enabling your bots to create Monday.com items.

## Configuration

This integration makes use of a personal access token from Monday.com. You need to acquire your personal access token and provide it to the integration when you install it with your bot.

### Monday

Along with your personal access token, you will need to identify the Board IDs of the Monday.com Boards you would like your bot to interact with.

#### Access token

Please refer to the [Authentication Guide](https://developer.monday.com/api-reference/docs/authentication#get-your-token) in the Monday documentation to learn how to acquire your personal access token.

#### Board ID

In order to find your Board ID, log into Monday and navigate to your Board. Then, inspect the URL in your address bar. See the following example:

```
https://<your-workspace-id>.monday.com/boards/9012345678
```

In the URL provided above, the Board ID would be `9012345678`. Keep this (and any other relevant board IDs) around for when configure actions using the Botpress integration.

### Botpress

1. Install the Monday integration in your Botpress bot.
2. Paste the personal access token in the configuration field.
3. Save configuration.
