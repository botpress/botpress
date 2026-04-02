# Kommo Integration

The Kommo integration allows you to connect your Botpress chatbot with Kommo. With this integration, your chatbot can create and update leads, manage contacts, and search through your CRM data.

## Prerequisites

Before using this integration, you need:

1. A **Kommo account** with administrator access
2. A **private integration** created in your Kommo account
3. A **long-lived access token** from your private integration

## Configuration

To set up the Kommo integration in Botpress:

### Step 1: Create a Private Integration in Kommo

1. Log in to your Kommo account.
2. Navigate to **Settings** → **Integrations marketplace**.
3. Click **Create Integration** at the top-right corner.
4. Give your integration a name.
5. Select all scopes.
6. Save the integration.

### Step 2: Generate an Access Token

1. In your integration settings, click **Generate long-lived token**
2. Select an expiration date.
3. Copy the **long-lived token**.

### Step 3: Configure Botpress Integration

In your Botpress integration settings, provide:

- **Base Domain**: Your Kommo subdomain (e.g., `yourcompany.kommo.com`)
  - Do not include `https://` or trailing slashes
  - Example: `mycompany.kommo.com`
- **Access Token**: Paste the long-lived access token from Step 2
