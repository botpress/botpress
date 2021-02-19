---
id: azure-oauth2
title: Setting up SSO with Azure AD OAuth2
---

**Note**: This is a Botpress Pro feature

**Note**: Azure OAuth2 only works for version 12.17.2 and later

## Step 1: Create a tenant

Navigate to Azure Active Directory Page in your Azure Portal and create a new tenant

## Step 2: Register an application

In the page of your newly created tenant navigate to "App registrations".

![App Registrations](assets/oauth/az_2_register_app.png)

Create a new application and choose the appropriate configuration for your use case in "Supported account types", single and multi tenant options are supported, and keep the "Redirect URI" blank for now.

![App Creation](assets/oauth/az_2.1_app_creation.png)

## Step 3: Configure Botpress

In your Botpress instance navigate to the code editor by going into any of your bots and add a new entry within `authStrategies` in the _botpress.config.json_ file, you may name the strategy whatever you want (keep the name URL safe) and fill in the entry in the following way:

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

## Step 4: Create a client secret

Next navigate to "Certificates & secrets" and create a new client secret, copy its value and paste in the `clientSecret` field of your created strategy in the _botpress.config.json_ file

![Secret creation](assets/oauth/az_4_create_secret.png)

## Step 5: Enable the strategy in Botpress

Under the `pro` settings in the _botpress.config.json_ file (should be around line 143), add your strategy name to the `collaboratorsAuthStrategies` array.

![Enable strategy](assets/oauth/az_5_enable_strategy.png)

Also make sure that the `externalAuth` object has `enabled` set to `true`:

![Enable external auth](assets/oauth/az_5_enable_external_auth.png)

## Step 6: Configure callback URL in Azure

In your application in the Azure Active Directory portal, navigate to the "Authentication" page and add a platform. **Select "Web" for the platform type** and set your callback url with the one you configured in the _botpress.config.json_ file. **For the token type select "ID tokens".**

![Configure callback in Azure](assets/oauth/az_6_configure_callback.png)

## Step 7: Restart the Botpress server

A green cogwheel should appear in the bottom right of the Botpress UI, click it to restart the server.
