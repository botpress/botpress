# Klaviyo Integration

The Klaviyo integration allows you to connect your Botpress chatbot with Klaviyo, a leading customer data and marketing automation platform. With this integration, your chatbot can create and manage customer profiles, track events, and automate marketing workflows directly within Klaviyo.

## Configuration

### Manual Configuration with API Key

To set up the Klaviyo integration, you'll need to provide your Klaviyo Private API Key. This allows your chatbot to interact with your Klaviyo account securely.

#### Step 1: Get your Klaviyo API Key

1. Log in to your Klaviyo account
2. Navigate to **Account** → **Settings** → **API Keys**
3. Click **Create API Key**
4. Give your API key a descriptive name (e.g., "Botpress Integration")
5. Select the appropriate scopes for your use case:
   - **Read** - to retrieve profiles and data
   - **Write** - to create and update profiles
   - **Metrics** - to track events and metrics
6. Click **Create API Key**
7. **Important**: Copy the API key immediately as it won't be shown again

#### Step 2: Configure the Integration in Botpress

1. In Botpress, navigate to the Klaviyo integration settings
2. Select **Manual Configuration**
3. Paste your Klaviyo Private API Key into the **API Key** field
4. Click **Save** to save the configuration

#### Step 3: Test the Configuration

The integration will automatically validate your API key when you save the configuration. If the validation fails, please:

- Double-check that you copied the API key correctly
- Ensure the API key has the necessary permissions (Read/Write)
- Verify that your Klaviyo account is active and in good standing

## Available Actions

### Create Profile

Create a new customer profile in Klaviyo with the following information:

- Email address (required if no phone provided)
- Phone number in E.164 format (required if no email provided)
- First name, last name
- Organization and job title
- Locale information
- Address details

**Note**: Either email or phone number is required to create a profile.

## Security Notes

- Your API key is stored securely and encrypted
- The integration only requests the minimum required permissions
- All API communications are encrypted using HTTPS

## Support

If you encounter any issues with the integration:

1. Verify your API key has the correct permissions
2. Check that your Klaviyo account is active
3. Review the Botpress logs for detailed error messages
4. Contact support if the issue persists
