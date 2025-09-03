The Hubspot integration allows you to connect your Botpress chatbot with Hubspot, a leading CRM and marketing automation platform. With this integration, your chatbot can manage contacts, tickets, and more directly within Hubspot, enabling seamless automation of sales, marketing, and support workflows.

## Configuration

To protect the sensitive data in your HubSpot workspace, this integration requires you to create and configure your own private HubSpot app. While we recognize this adds complexity to the setup process, it ensures your data remains secure. We're actively collaborating with HubSpot to streamline this into a one-click setup experience. In the meantime, please follow the steps below to manually configure the integration.

### Manual configuration with a custom OAuth app

1. Install the integration in your bot and copy the webhook URL. This URL starts with `https://webhook.botpress.cloud/`.
2. From your HubSpot settings dashboard, navigate to _Account Management_ &gt; _Integrations_ &gt; _Legacy Apps_.
3. Create a new Legacy App and make it private.
4. Under the _Scopes_ tab, please add the following scopes:
   - `oauth`
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
6. You may now optionally subscribe to webhook events. In the _Create new webhook subscriptions_ dialog, enable _expanded object support_, then select the events you wish to subscribe to. Currently, the integration supports the following events:
   - Company Created
   - Company Deleted
   - Contact Created
   - Contact Deleted
   - Lead Created
   - Lead Deleted
   - Ticket Created
   - Ticket Deleted
7. You may now click the _Create App_ button to create your Legacy App.
8. From your app's settings page, navigate to the _Auth_ tab and copy the _Access Token_ and _Client Secret_.
9. Paste the _Access Token_ and _Client Secret_ in Botpress, then save the integration's configuration.
