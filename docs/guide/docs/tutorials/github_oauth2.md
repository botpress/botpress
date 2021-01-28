---
id: github-oauth2
title: Setting up SSO with GitHub OAuth2
---

**Note**: This is a Botpress Pro feature

## Step 1: Create OAuth2 App

Go on GitHub's [OAuth application registration page](https://github.com/settings/applications/new), choose an application name, set the Homepage URL to either your organization's website or your Botpress instance's external URL. For the "Authorization callback URL", set the following value:

`https://<Your external Botpress HTTPS URL>/api/v1/auth/login-callback/oauth2/<Your strategy name>`

You may choose any url safe name as your strategy name

![Credentials creation](assets/oauth/gith_1_create_app.png)

## Step 2: Create credentials

Once on your created application's configuration page, copy the "Client ID", click on "generate a new client secret" and copy the generated value as well for the next step.

## Step 3: Configure Botpress

In your Botpress instance navigate to the code editor by going into any of your bots and add a new entry within `authStrategies` in the _botpress.config.json_ file, you may name the strategy whatever you want (keep the name URL safe) and fill in the entry in the following way:

```json
"<your strategy name>": {
  "type": "oauth2",
  "allowSelfSignup": false,
  "options": {
    "authorizationURL": "https://github.com/login/oauth/authorize",
    "tokenURL": "https://github.com/login/oauth/access_token",
    "clientSecret": "<Generated secret from GitHub>",
    "clientID": "<Client ID from GitHub>",
    "callbackURL": "https://<Your external Botpress HTTPS URL>/api/v1/auth/login-callback/oauth2/<Your strategy name>",
    "userInfoURL": "https://api.github.com/user",
    "scope": "user:email"
  },
  "fieldMapping": {
    "email": "email"
  }
}
```

## Step 4: Enable the strategy in Botpress

Under the `pro` settings in the _botpress.config.json_ file (should be around line 143), add your strategy name to the `collaboratorsAuthStrategies` array.

![Enable strategy](assets/oauth/az_5_enable_strategy.png)

Also make sure that the `externalAuth` object has `enabled` set to `true`:

![Enable external auth](assets/oauth/az_5_enable_external_auth.png)

## Step 7: Restart the Botpress server

A green cogwheel should appear in the bottom right of the Botpress UI, click it to restart the server.
