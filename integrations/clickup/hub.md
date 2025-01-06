Streamline your project management workflows and enhance productivity by integrating Botpress with ClickUp. This integration empowers your chatbot to interact seamlessly with your ClickUp account, automating task creation, retrieving updates, and managing your workspaces. Elevate your team's efficiency by allowing your chatbot to access and manipulate your ClickUp data, enabling faster decision-making and better organization. With this integration, your chatbot can help manage projects, assign tasks, and keep your team informed.

## Configuration

To use the ClickUp integration, you need to set up authentication and provide essential details from your ClickUp account.

### Obtaining Your API Key and Team ID

1. **Generate an API Key:**

   - Log in to your ClickUp account.
   - Go to your profile settings and select the **Apps** section.
   - Generate or retrieve your API key.

2. **Find Your Team ID:**
   - Navigate to the left menu bar of your ClickUp workspace.
   - Copy the URL of the workspace (e.g., `https://app.clickup.com/9011669285/v/s/90112461548`).
   - The **last ID in the URL** is your team ID (in this case, `90112461548`).

### Configuring the Integration in Botpress

1. Navigate to the **Integrations** section in your Botpress workspace.
2. Select the **ClickUp Integration** and open the configuration panel.
3. Enter the following details:
   - Your ClickUp API key.
   - Your team ID.
4. Save the configuration and enable the integration.
5. Once configured, the chatbot will be able to interact with your ClickUp workspace.

## Limitations

The ClickUp integration is subject to the platform's API limitations, including rate limits and payload size restrictions. Key constraints include:

- **Rate Limits:** Each workspace is limited to 100 requests per minute and 10 requests per second.
- **Payload Size:** API calls may have size restrictions, so ensure data sent in requests adheres to ClickUp's specifications.

Refer to the [ClickUp API documentation on rate limits](https://clickup.com/api/developer-portal/rate-limits/) for more details and best practices to avoid exceeding these limits.
