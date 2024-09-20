Optimize your customer support workflow with the Zendesk integration for your chatbot. Seamlessly manage tickets, engage customers, and access critical information—all within your bot. Elevate your customer service game and improve internal processes by triggering automations from real-time ticket updates.

## Installation and Configuration

1. Navigate to the Zendesk Admin Center.
2. Activate the Zendesk API feature.
3. Proceed to Settings and choose the option to Enable Token Access.
4. Incorporate your API token. For more details on this, refer to the [API Token Documentation](https://developer.zendesk.com/api-reference/introduction/security-and-auth/#api-token)

### Usage

For this integration, you'll require both a username and a password. Ensure you append /token to the end of the specified username.

For instance:

Username: `jdoe@example.com/token`
Password: `API_TOKEN`

### Knowledge Base Sync

1.  Toggle the "Sync Knowledge Base With Bot" option to start syncing.
2.  Enter the ID of the desired knowledge base where your Zendesk articles will be stored.
3.  Enable the integration to complete the setup.

Once these steps are completed, your Zendesk articles will automatically sync to the specified knowledge base in Botpress. You can manually sync by using the "Sync KB" action.
