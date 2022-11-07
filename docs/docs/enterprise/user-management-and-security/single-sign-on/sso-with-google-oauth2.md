---
id: sso-with-google-oauth2
title: SSO with Google OAuth2
---

--------------------

## Step 1 - Create OAuth2 Credentials

1. Go to your [Google Cloud dashboard](https://console.cloud.google.com/).
1. Create a project.
1. Navigate to **APIs & Services** from the sidebar.
1. Access the **Credentials** section.
1. Click **Create Credentials**. 
1. Choose the **OAuth client ID** option.

## Step 2 - Configure OAuth2 on Google Cloud

1. On the client configuration page, choose **Web application** for the **Application type**.
1. Name it.
1. Under **Authorized redirect URIs**, add the following entry:

`https://<Your external Botpress HTTPS URL>/api/v1/auth/login-callback/oauth2/<Your strategy name>`

:::note
You may choose any URL safe name as your strategy name.
:::

A popup with your client ID and client secret will show up, keep them for the next step.

## Step 3 - Configure Botpress

1. In your Botpress instance navigate to the **Code Editor**.
1. Add a new entry within `authStrategies` in the `botpress.config.json` file.
1. You may name the strategy whatever you want (keep the name URL safe).
1. Fill in the entry in the following way:

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

## Step 4 - Enable the Strategy in Botpress

Under the **Pro** settings in the `botpress.config.json` file (should be around line 143), add your strategy name to the `collaboratorsAuthStrategies` array.

Also make sure that the `externalAuth` object has `enabled` set to `true`:

```json
"pro": {
	"collaboratorsAuthStrategies": [
	"default",
	"<Your strategy name>"
	],
```

Also make sure that the `externalAuth` object has `enabled` set to `true`:

```json
"externalAuth": {
	"enabled": true,
	"algorithms": [
	"HS256"
	],
```

## Step 5 - Restart the Botpress Server

A green cogwheel should appear in the bottom right of the Botpress UI, click it to restart the server.
