---
id: azure-oauth2
title: Azure OAuth2
---

--------------------

:::note
Azure OAuth2 only works for version 12.17.2 and later.
:::

## Step 1 - Create a Tenant

Navigate to Azure Active Directory Page in your Azure Portal and create a new tenant.

## Step 2 - Register an Application

In the page of your newly created tenant navigate to **App registrations**.

Create a new application and choose the appropriate configuration for your use case in **Supported account types**. 
At this step, be sure you select the right option to ensure you are able to log in later.

For testing, we recommend using "Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)" as it will allow you to login using non-microsoft credentials and is the most stable way to try it out. For the other options, you will have to configure your accounts in Azure AD directory and login using those accounts.

Keep the **Redirect URL** blank for now.

## Step 3 - Configure Botpress

In your Botpress instance, navigate to the **Code Editor** in the Conversation Studio of the selected bot(s) and add a new entry within `authStrategies` in the `botpress.config.json` file. You may name the strategy whatever you want (keep the name URL safe) and fill in the entry in the following way:

```json
"<your strategy name>": {
  "type": "oauth2",
  "allowSelfSignup": false,
  "options": {
    "authorizationURL": "<OAuth 2.0 authorization endpoint (v2)>",
    "tokenURL": "<OAuth 2.0 token endpoint (v2)>",
    "clientSecret": "<See step 4>",
    "clientID": "<Application (client) ID>",
    "callbackURL": "https://<Your external Botpress HTTPS URL>/api/v1/auth/login-callback/oauth2/<Your strategy name>",
    "scope": "openid profile email",
    "userInfoURL": "https://graph.microsoft.com/oidc/userinfo"
  },
  "fieldMapping": {
    "email": "email"
  }
}
```

## Step 4 - Create a Client Secret

1. Navigate to **Certificates & secrets**. 
1. Create a new client secret. 
1. Copy its value.
1. Paste it in the `clientSecret` field of your created strategy in the `botpress.config.json` file.

## Step 5 - Enable the Strategy in Botpress

Under the **Pro** settings in the `botpress.config.json` file, add your strategy name to the `collaboratorsAuthStrategies` array.

Also make sure that the `externalAuth` object has `enabled` set to `true`.

## Step 6 - Configure Callback URL in Azure

1. In your application in the Azure Active Directory portal, navigate to the **Authentication** page.
1. Add a platform. 
  1. Select **Web** for the platform type.
  1. Set your callback url with the one you configured in the `botpress.config.json` file.
  1. For the token type select **ID tokens**.

## Step 7 - Restart the Botpress Server

A green cogwheel should appear in the bottom right of the Botpress UI, click it to restart the server.
