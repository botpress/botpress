---
id: version-12.17.0-google-oauth2
title: Setting up SSO with Google OAuth2
original_id: google-oauth2
---

**Note**: This is a Botpress Pro feature

## Step 1: Create OAuth2 credentials

Go to your [Google Cloud dashboard](https://console.cloud.google.com/), create a project if you have not already done so and navigate to "APIs & Services" from the sidebar. Once there go to the "Credentials" section and click "Create Credentials". Choose the "OAuth client ID" option.

![Credentials creation](assets/oauth/goog_1_create_oauth2_creds.png)

## Step 2: Configure OAuth2 on Google Cloud

Once on the client configuration page choose "Web application" for the "Application type", give the application any name you want and under "Authorized redirect URIs" and the following entry:

`https://<Your external Botpress HTTPS URL>/api/v1/auth/login-callback/oauth2/<Your strategy name>`

You may choose any url safe name as your strategy name

![Configure client](assets/oauth/goog_2_configure_client.png)

A popup with your client ID and client secret will show up, keep them for the next step

## Step 3: Configure Botpress

In your Botpress instance navigate to the code editor by going into any of your bots and add a new entry within `authStrategies` in the _botpress.config.json_ file, you may name the strategy whatever you want (keep the name URL safe) and fill in the entry in the following way:

```json
"<your strategy name>": {
  "type": "oauth2",
  "allowSelfSignup": false,
  "options": {
    "authorizationURL": "https://accounts.google.com/o/oauth2/v2/auth",
    "tokenURL": "https://www.googleapis.com/oauth2/v4/token",
    "clientSecret": "<client secret from Google Cloud>",
    "clientID": "<client ID from Google Cloud>",
    "callbackURL": "https://<Your external Botpress HTTPS URL>/api/v1/auth/login-callback/oauth2/<Your strategy name>",
    "userInfoURL": "https://openidconnect.googleapis.com/v1/userinfo",
    "scope": "openid profile email"
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
