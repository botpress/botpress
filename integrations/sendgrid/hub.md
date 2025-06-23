# SendGrid Integration

## Overview
`@botpresshub/sendgrid` is an integration that allows a Botpress chatbot to send emails via the SendGrid API.

## Configuration
### Acquiring an API key (https://app.sendgrid.com/settings/api_keys)
  1) Login to the SendGrid dashboard (https://app.sendgrid.com/)
  2) In the navigation bar on the left, open "Settings" submenu, click on "API Keys"
  3) Near the top-right, click "Create API Key"
  4) Give the key a name
  5) Grant the key permissions with either "Full Access" or if using "Restricted Access" select the following:
     1) "Mail Send" (Full Access)
  6) Click "Create & View"
### Enable 2FA
  1) TODO
### Authenticating your domain
  1) TODO

## Actions
- ### Send Mail
    Send a plain text email to the specified email address via one of your domain's email addresses.

## Usage


## Side Notes
The current implementation is limited to only sending plain text emails, though this will be expanded upon in the future.


## Resources
- https://www.twilio.com/docs/sendgrid/for-developers
- https://www.twilio.com/docs/sendgrid/api-reference
- https://www.twilio.com/docs/sendgrid/ui/account-and-settings/api-keys
- https://www.twilio.com/docs/sendgrid/ui/account-and-settings/how-to-set-up-domain-authentication
