---
id: version-11.9.5-authentication
title: Authentication Methods
original_id: authentication
---

There's two different types of authentication, and different methods for each:

1. **Admin**: Allow a user to access the Admin UI and manage bots
2. **User**: Identify a user which is chatting with your bot

We support Basic, SAML and LDAP for the Admin authentication.

User Authentication is managed using JWT tokens

## Admin Authentication

There are 3 different type of authentication methods. By default, the `basic` method is used.

### Basic

Users logs in with an Email / Password combination. Information is saved in the file `data/global/workspaces.json`, and they are salted for added security.

To create more accounts, visit the `Collaborators` tab on the Admin UI. Choose the role and enter the E-mail of your collaborator, then you will receive a random password. The user will need to pick a password after the first login.

To enable this authentication method, set `pro.auth.strategy = 'basic'` in your `botpresss.config.json` file.

#### Forgot your password?

If you forget your password and cannot access your bot, open the `workspaces.json` file and delete the user account. You will be prompted to create an account the next time you access the Admin UI.

Replace the following content with `"users": []`

```js
"users": [
  {
    "email": "admin@botpress.io",
    "password": "713f2a9c8382c8bec72dced71c787adf4ba3d0aa635a8201b0ee78700758919b4eb042ac4f2c8848bbdde05a734185f85903426b6fbc0fe8c76493e28bbcc7b3",
    "salt": "2af382287ebef39d",
    "firstname": "",
    "lastname": "sdf"
  }
]
```

### SAML

You can link your SAML Identity Provider seamlessly with Botpress. When it is enabled, Admins will be greeted with a `Sign in with SSO` button on the Admin UI. The first user to ever login to Botpress using the SSO provider will automatically have an account created and will be a Super Admin.

When a user successfully log on the Admin UI, Botpress will create an internal account for that user. These will be listed in the `workspaces.json` file.

There are two possible behaviors. You can either:

- Allow any user that successfully logs on using your SAML IdP to create an account. Set `pro.auth.allowSelfSignup` to `true`
- Manage users manually (you need to add their emails in the Collaborators page). Set `pro.auth.allowSelfSignup` to `false`

#### Prerequisite

- Botpress Pro enabled with a valid license key
- A SAML IdP (Identity Provider)

#### Quick Start

1. Open `botpress.config.json` and set `pro.auth.strategy = 'saml'`
2. Configure the available options. The complete list of SAML options is [available here](https://github.com/bergie/passport-saml).

Here is a complete example

```js
"auth": {
  "strategy": "saml",
  "options": {
    "entryPoint": "https://botpress-saml-idp.auth0.com/somestuff/bla",
    "callbackUrl": "http://localhost:3000/admin/login-callback",
    "path": "/login-callback",
    "issuer": "botpress-saml",
    "cert": "MIIDETCCAfmgAwIBAgIJIHQ75dJxjRuEMA0GCSqGSIb3DQEBCwUAMCYxJDAiBgNVBAMTG2JvdHByZXNzLXNhbWwtaWRwLmF1dGgwLmNvbTAeFw0xOTAxMTUxNTAzMDFaFw0zMjA5MjMxNTAzMDFaMCYxJDAiBgNVBAMTG2JvdHByZXNzLXNhbWwtaWRwLmF1dGgwLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMUHXzCG3c4iSyU1N1Nzu8LsEIQ8tj5SHG+VtHrhWyfdckq5nP2wy/u6Tt20pdOx+4zu1718x2xVPMwFN9M2uUSJaY6vIXfHofKyn1htuYYzOklLZmnrLX4Pm7YHE2SubAsuwg6e7/sgIZ06T",
    "acceptedClockSkewMs": 5000
  },
  "fieldMapping": {
    "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    "firstname": "cn"
  },
  "allowSelfSignup": false
}
```

### LDAP

#### Prerequisite

- Botpress Pro enabled with a valid license key
- Informations to access the LDAP server

#### Quick Start

1. Open `botpress.config.json` and set `pro.auth.strategy = 'ldap'`
2. Configure the available options: [check the full configuration for more details](https://github.com/botpress/botpress/blob/master/src/bp/core/config/botpress.config.ts)

### Field Mapping

The `fieldMapping` configuration allows you to match existing properties of your users with the one Botpress uses. These are the fields that you can define for users: `email`, either `fullname` or `firstname` with `lastname`, `company`, `role` and `location`.

Whenever a user successfully logs on using SAML or LDAP, his details will be updated in his Botpress profile.

```js
{
  "fieldMapping": {
    "email": "emailAddressOnIdp",
    "fullname": "userFullName",
    "company": "!Botpress",
    "role": "userRole",
    "location": "officeLocation"
  }
}
```

## User Authentication

Using External Authentication, it is possible to authenticate a user on your system, then validate his identity each time he sends a message to the bot. That information can be used in Actions, Hooks, and for Transitions on the Flow Editor.

Here's a summary of the process:

1. User authenticate on your platform
2. Your platform returns a JWT token to the user and configure the webchat
3. The token is sent to Botpress everytime a message is sent
4. Botpress validates the token, decrypt the content and makes it available through `event.credentials`

### Prerequisite

- Botpress Pro must be enabled with a valid license
- A backend that will authenticate the user and generate the JWT token
- The public key used by the backend

### Quick Start

1. Edit `data/global/botpress.config.json` and set `pro.externalAuth.enabled` to `true`
2. Configure the other variables for the JWT token (issuer, audience, algorithm, publicKey)
3. Restart Botpress
4. Edit the code of the embedded webchat to send the generated JWT token
5. Enjoy!

Here is an example configuration, [check the full configuration for more details](https://github.com/botpress/botpress/blob/master/src/bp/core/config/botpress.config.ts)

```js
"externalAuth": {
  "enabled": true,
  "audience": "users",
  "issuer": "botpress",
  "algorithm": "HS256"
  "publicKey": "MIIDETCCAfmgAwIBAgIJIHQ75dJxjRuEMA0GCSqGSIb3DQEBCwUAMCYxJDAiBgNVBAMTG2JvdHByZXNzLXNhbWwtaWRwLmF1dGgwLmNvbTAeFw0xOTAxMTUxNTAzMDFaFw0zMjA5MjMxNTAzMDFaMCYxJDAiBgNVBAMTG2JvdHByZXNzLXNhbWwtaWRwLmF1dGgwLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMUHXzCG3c4iSyU1N1Nzu8LsEIQ8tj5SHG+VtHrhWyfdckq5nP2wy/u6Tt20pdOx+4zu1718x2xVPMwFN9M2uUSJaY6vIXfHofKyn1htuYYzOklLZmnrLX4Pm7YHE2SubAsuwg6e7/sgIZ06T",
  }
}
```

#### How to configure the Public Key

The public key can be added directly in the `botpress.config.json` file (on the same line). If you prefer to add the key in a file, remove the property `certificate`, and Botpress will load the key from `data/global/end_users_auth.key`

#### How to create a new Key Pair

The certificate must be in the PEM format. You can use the below commands to generate one.

```bash
ssh-keygen -t rsa -b 4096 -m PEM -f jwtRS256.key
openssl rsa -in jwtRS256.key -pubout -outform PEM -out jwtRS256.key.pub
cat jwtRS256.key // Your private key
cat jwtRS256.key.pub // Your public key
```

### Authenticate the user

Once you have generated the JWT token, it must be passed down to the web chat. It will then be sent to Botpress with every message and events. Check out the [Connecting your bot with your existing backend](../tutorials/existing-backend) for more details. There are two different situations:

1. The user is authenticated before the webchat is loaded.

Simply add the external token as an option to the `init` method:

```js
window.botpressWebChat.init({
  host: 'http://localhost:3000',
  botId: botId,
  externalAuthToken: 'my.jwt.token'
})
```

2. The user is already discussing with the bot, then he is authenticated

Use the `configure` method to change the option:

```js
window.botpressWebChat.configure({ externalAuthToken: 'my.jwt.token' })
```

### How to use the authenticated payload

When a user is authenticated, the JWT token is automatically decoded. If the token is valid, all the data it contains will be available through the `event.credentials` property. This can be accessed inside Hooks and while using Actions.
