---
id: saml
title: SAML
---

--------------------

You can link your SAML Identity Provider seamlessly with Botpress. When it is enabled, Admins will be greeted with a `Sign in with SSO` button on the Admin UI. The first user to ever log in to Botpress using the SSO provider will automatically have an account created and a Super Admin.

When a user successfully logs on to the Admin UI, Botpress will create an internal account for that user. Botpress will add them to the table `strategy_STRATEGYID`

There are two possible behaviors. You can either:

- Allow any user that successfully logs on using your SAML IdP to create an account. Set `allowSelfSignup` to `true`
- Manage users manually (you need to add their emails to the Collaborators page). Set `allowSelfSignup` to `false`

## Prerequisite

- Botpress Enterprise enabled with a valid license key
- A SAML IdP (Identity Provider)

## Quick Start
Let's use SAML to authenticate a user. We will use `jumpcloud`, a popular authentication provider. Head over to the User Authentication menu and select SSO. Select a SAML Identification provider from the ones available on the list or create a new one. For this tutorial, we used Google. Enter the required information, supplying your domain name at all positions marked **YOURDOMAIN**

After creating your application, you will get the option to download your certificate. Your entry point url will appear next to your application labeled as IdP URL.

1. Open `botpress.config.json` and set `pro.auth.strategy = 'saml'`
2. Configure the available options. The complete list of SAML options is [available here](https://github.com/bergie/passport-saml).

Here is a complete example

```js
"auth": {
  "strategy": "saml",
  "options": {
    "entryPoint": "https://botpress-saml-idp.auth0.com/somestuff/bla",
    "callbackUrl": "http://botpress.yourdomain.net/api/v1/auth/login-callback/saml/saml",
    "path": "http://botpress.yourdomain.net/api/v1/auth/login-callback/saml/saml",
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