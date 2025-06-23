# Resend Integration

## Overview

`@botpresshub/resend` is an integration that allows a Botpress chatbot to send emails via the Resend API.

## Configuration

### Authenticating your domain (https://resend.com/domains)

1. Login to the Resend dashboard (https://resend.com/)
2. In the navigation bar on the left, click on "Domains"
3. Near the top-right, click "Add Domain"
4. In the "Name" field, enter your domain (e.g. "Botpress.com")
5. (Optional) Select the server region closest to your user base
6. (Optional) Customize the return path (Only recommended if you know what this does)
7. Click "Add Domain" (Below "Advanced options")
8. Add the DNS records in the portal of your domain provider (e.g. SquareSpace, GoDaddy, etc.)
   1. While the DMARC record is optional, it's recommended to protect against spoofing/unauthorized use of the domain
9. Click "I've added the records" and wait for each status to be marked as "Verified"
10. Now you're ready to send emails with your domain. Happy Emailing!

### Acquiring an API key (https://resend.com/api-keys)

1. Login to the Resend dashboard (https://resend.com/)
2. In the navigation bar on the left, click on "API Keys"
3. Near the top-right, click "Create API Key"
4. Give the key a name & grant the key "Sending Access"
   1. Optionally, choose which domains you want the key to send emails through
5. Click "Add" to generate the API Key
6. Copy the resulting API key into a secure location as it will only be shown once

### Adding the API key to the integration config via Botpress Studio (https://studio.botpress.cloud/)

1. Login to Botpress studio (https://studio.botpress.cloud/)
2. Select the bot you want to add the integration to (Can be skipped if you only have 1 bot)
3. In the bottom section of the left navigation bar, click the integrations tab (3 stacked boxes/cubes)
4. Find the Resend integration in the list and click on it (This should open to the configuration tab)
5. Paste the API key in the API key field.

### Enable 2FA

[//]: # 'Figure out how to have a light/dark mode icon variants. If possible'

1. ![Integrations](./assets/integrations-icon.svg)

## Actions

- ### Send Mail
  Send a plain text email to the specified email address via one of your domain's email addresses.

## Usage

## Side Notes

The current implementation is limited to only sending plain text emails, though this will be expanded upon in the future.

## Resources
