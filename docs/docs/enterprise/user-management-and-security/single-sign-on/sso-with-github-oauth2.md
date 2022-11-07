---
id: sso-with-github-oauth2
title: SSO with GitHub OAuth2
---

--------------------

## Step 1 - Create OAuth2 App

1. Go on GitHub's [OAuth application registration page](https://github.com/settings/applications/new).
1. Choose an application name.
1. Set the Homepage URL to either your organization's website or your Botpress instance's external URL. 
1. For the **Authorization callback URL**, set the following value:

`https://<Your external Botpress HTTPS URL>/api/v1/auth/login-callback/oauth2/<Your strategy name>`

:::note
You may choose any url safe name as your strategy name.
:::

## Step 2 - Create Credentials

1. In your application's configuration page, copy the **Client ID**.
1. Click on **generate a new client secret** and copy the generated value as well for the next step.

## Step 3 - Configure Botpress

1. In your Botpress instance, navigate to the **Code Editor**.
1. add a new entry within `authStrategies` in the `botpress.config.json` file.
  1. Name the strategy whatever you want (keep the name URL safe).
  1. fill in the entry in the following way:

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

## Step 4 - Enable the Strategy in Botpress

Under the **Pro** settings in the `botpress.config.json` file, add your strategy name to the `collaboratorsAuthStrategies` array.

Also make sure that the `externalAuth` object has `enabled` set to `true`:

## Step 5 - Restart the Botpress Server

A green cogwheel should appear in the bottom right of the Botpress UI, click it to restart the server.
