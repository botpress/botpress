The HubSpot integration allows you to connect your Botpress chatbot with HubSpot, a leading CRM and marketing automation platform. With this integration, your chatbot can manage contacts, tickets, and more directly within HubSpot, enabling seamless automation of sales, marketing, and support workflows. It also supports Human-in-the-Loop (HITL), allowing conversations to be escalated to HubSpot agents in real time.

## Configuration

The recommended way to configure this integration is via the built-in **OAuth wizard**, which handles authorization and configuration automatically. You can start the wizard directly from the integration's configuration page in Botpress by clicking on the "Connect/Authorize" button.

For advanced users who need full control over their HubSpot app, a **manual configuration** option is also available. Follow the steps below to set it up.

### Manual configuration with a custom private app

1. Install the integration in your bot and copy the webhook URL. This URL starts with `https://webhook.botpress.cloud/`.
2. From your HubSpot settings dashboard, navigate to _Account Management_ &gt; _Integrations_ &gt; _Legacy Apps_.
3. Create a new Legacy App and make it private.
4. Under the _Scopes_ tab, please add the following scopes:
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
   - `tickets`
   - `crm.objects.owners.read`
   - `crm.objects.companies.read`
   - `crm.objects.companies.write`
   - `crm.objects.leads.read`
   - `crm.objects.leads.write`
   - `crm.objects.deals.read`
   - `crm.objects.deals.write`
5. Under the _Webhooks_ tab, paste your webhook URL, set _Event Throttling_ to 1, and click _Create Subscription_.
6. You may now optionally subscribe to webhook events. In the _Create new webhook subscriptions_ dialog, **you must enable _expanded object support_** before selecting the events you wish to subscribe to. Currently, the integration supports the following events:

   - Company Created
   - Company Deleted
   - Contact Created
   - Contact Deleted
   - Lead Created
   - Lead Deleted
   - Ticket Created
   - Ticket Deleted

7. You may now click the _Create App_ button to create your Legacy Private App.
8. From your app's settings page, navigate to the _Auth_ tab and copy the _Access Token_ and _Client Secret_. In the Botpress integration configuration, paste them and save.

| Field         | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| Access Token  | The Access Token from your Private App                           |
| Client Secret | Your app's Client Secret (used for webhook signature validation) |

### HITL (Human-in-the-Loop) manual configuration

If you already have the CRM integration configured, you can reuse the same Private App — just add the HITL scopes and retrieve a few additional values.

#### 1. Add HITL Scopes to Your Private App

In your HubSpot settings, open your existing Private App and add the following scopes (in addition to the CRM scopes already configured):

- `conversations.custom_channels.read`
- `conversations.custom_channels.write`
- `conversations.read`
- `conversations.write`
- `files`

#### 2. Add a Webhook Subscription

Under the **Webhooks** tab, subscribe to:

- `conversation.propertyChange` (for agent assignment and conversation status changes), select all properties.

#### 3. Click _Commit Changes_ to save the updated scopes and webhook subscriptions.

#### 4. Get Your App ID and Developer API Key

- **App ID**: Open your private App in HubSpot again — the App ID is in the URL (e.g., `https://app.hubspot.com/private-apps/ACCOUNT_ID/36900466`).
- **Developer API Key**: In your Hubspot Dashboard, navigate to _Development_ > _Keys_ > _Developer API Key_ and copy or generate your key.

#### 5. Retrieve Your Help Desk or Inbox IDs

You need the ID of the HubSpot inbox (or Help Desk) where HITL conversations will be routed. Use the Access Token from your Private App (found in the _Auth_ tab) to call the inboxes API.

You can run this in a terminal, or use a tool like [Postman](https://www.postman.com/) or [ReqBin](https://reqbin.com/). Replace `YOUR_ACCESS_TOKEN` with the token from your Private App:

```bash
curl --location 'https://api.hubapi.com/conversations/v3/conversations/inboxes' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

The response will list all inboxes in your HubSpot account. Look for the entry matching your target inbox and copy its `id`. For Help Desk, look for `"type": "HELP_DESK"`. For a standard inbox, look for `"type": "INBOX"`.

```json
{
  "results": [
    { "id": "1431487401", "name": "Help Desk", "type": "HELP_DESK" },
    { "id": "1234567890", "name": "Sales Inbox", "type": "INBOX" }
  ]
}
```

You can connect multiple inboxes — the first one will be used as the default.

#### 6. Configure Botpress

Fill in the following fields in your Botpress integration configuration:

| Field             | Value                                                                     |
| ----------------- | ------------------------------------------------------------------------- |
| App ID            | Your app's App ID from step 4                                             |
| Developer API Key | Your developer API key from step 4                                        |
| Inbox IDs         | One or more inbox or Help Desk IDs from step 5. The first is the default. |

Save the configuration. After saving, it may take **over a minute** for the HubSpot custom channel to connect. Do not refresh or close the page during this time.

## Migrating from 4.x to 5.x

Version 5.x addresses issues that could cause your bot to crash during certain operations. The search actions (`Search Contact`, `Search Deal`, `Search Lead`) now have optional outputs — they return undefined instead of throwing an error when a resource is not found. Make sure to handle this in your bot’s logic to avoid unexpected behavior.

## Migrating from 3.x to 4.x

### Default properties

The default properties returned when searching for or retrieving a CRM object may have changed. If your bot relied on a property that is now missing, add the property's name to the `properties` input parameter of the get or search action for the relevant CRM object.

### Unified output structure

- All actions now return the CRM object relevant to the action directly within the output schema, ensuring consistency across all action responses. If an object is updated, some properties may not appear in the output. For example, the `createTicket` action now returns an object with the following structure:

```ts
type CreateTicketOutput = {
  ticket: {
    id: string
    subject: string
    category: string
    description: string
    priority: string
    source: string
    properties: Record<string, string>
  }
}
```

### Deal and Lead

- There are now dedicated input parameters for setting and updating the names of deals or leads. The name is also included as a dedicated property of the CRM object in the output.
- You can now specify properties to include in the output when searching for or retrieving a deal or lead.

### Ticket

- The `category`, `priority`, and `source` input parameters can now accept any valid string that corresponds to a valid value in your HubSpot account.
- The `linearTicketUrl` input parameter has been removed, as it may not be a valid property in all HubSpot accounts. If your bot was setting this property, set it as an additional property in the `property` input parameter.
