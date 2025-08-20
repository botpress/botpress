# Calendly Integration

## Overview

`@botpresshub/calendly` is an integration that allows a Botpress chatbot to schedule events via Calendly. It also allows the chatbot respond when an event is scheduled, cancelled, as well as, if the invitee did not show up to an event.

## Configuration

### Acquiring an access token (https://calendly.com/integrations/api_webhooks)

1. Login to the Calendly dashboard (https://calendly.com/login/)
2. In the navigation bar on the left, click on "Integrations & apps"
3. In the search bar type "Webhooks" and click on "API and webhooks"
4. Under "Your personal access tokens" click "Generate New Token"
5. Give the token a name (e.g. 'Botpress Chatbot') and click "Create token"
6. Validate your account by providing the verification code (typically sent to the account's email address)
   - If you don't see it in your inbox be sure to also check your Junk/Spam folder
7. Click the "Copy token" button and save it to a secure location as it will only be shown once.
8. Finally, paste the Personal Access Token into the Botpress config
