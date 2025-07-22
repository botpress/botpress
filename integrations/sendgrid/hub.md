# SendGrid Integration

## Overview

`@botpresshub/sendgrid` is an integration that allows a Botpress chatbot to send emails via the SendGrid API.

## Configuration

### Authenticating your domain (https://app.sendgrid.com/settings/sender_auth)

1. Login to the SendGrid dashboard (https://app.sendgrid.com/)
2. In the navigation bar on the left, open "Settings" submenu, click on "Sender Authentication"
3. In the center-right part of the screen, click the "Get Started" button (First domain authentication only)
   - (2nd+ domain auth) Near the lower left in the "Domain Authentication" section, click "Authenticate Your Domain"
4. Select the provider for your domain, if the provider is not listed, pick "I'm Not Sure" (It's easier than "Other host" option)
   - Also tested with SquareSpace Domains
5. In the "From Domain" field, enter your domain (e.g. "Botpress.com")
6. Add the DNS records in the portal of your domain provider (e.g. Cloudflare, GoDaddy, SquareSpace, etc.)
7. Check "I've added these records" & click "Verify" and wait for SendGrid to confirm it's been verified.
   - If an error is still shown in spite of correctly adding the 'CNAME' DNS records to your domain provider, try removing the domain suffix from the host key. (e.g. "em1234.botpress.com" > "em1234")
8. Now you're ready to send emails with your domain. Happy Emailing!

### Acquiring an API key (https://app.sendgrid.com/settings/api_keys)

1. Login to the SendGrid dashboard (https://app.sendgrid.com/)
2. In the navigation bar on the left, open "Settings" submenu, click on "API Keys"
3. Near the top-right, click "Create API Key"
4. Give the key a name
5. Grant the key permissions with either "Full Access" or if using "Restricted Access" select the following:
   - "Mail Send" (Full Access)
6. Click "Create & View"

### Setting up Webhooks (https://app.sendgrid.com/settings/mail_settings/webhook_settings)

1. Login to the SendGrid dashboard (https://app.sendgrid.com/)
2. In the navigation bar on the left, open "Settings" submenu, click on "Mail Settings"
3. In Mail Settings, click on "Event Webhooks"
4. In the center-right part of the screen, click "Create new webhook"
5. (Optional) Give the webhook a "Friendly Name" (e.g. "Botpress Bot")
6. Copy the webhook URL from the Botpress integration config & paste it into Sendgrid's "Post URL" field
7. Select the "Actions to be posted", these will be the events that the Botpress integration will receive.
   1. Note: This integration doesn't support all the events yet
8. (Optional, but recommended) Enable "Signature Verification"
   1. If you've enabled this, once the webhook is saved, click the cog on the webhook and click "edit"
   2. Copy the "Verification key" from Sendgrid and paste it into the "Webhook Verification Key" field of the Botpress integration config
9. Click "Save" and you're ready to use the events in your Botpress bot

## Side Notes

The current implementation is limited to only sending [markdown](https://spec.commonmark.org/0.31.2/) rich text emails, though this will be expanded upon in the future.

## Resources

- https://www.twilio.com/docs/sendgrid/for-developers
- https://www.twilio.com/docs/sendgrid/api-reference
- https://www.twilio.com/docs/sendgrid/ui/account-and-settings/api-keys
- https://www.twilio.com/docs/sendgrid/ui/account-and-settings/how-to-set-up-domain-authentication
