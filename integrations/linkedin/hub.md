# LinkedIn

Connect your Botpress chatbot to LinkedIn to share posts and engage with your professional network. This integration enables your bot to interact with LinkedIn's API using OAuth authentication.

## Configuration

The LinkedIn integration requires OAuth authentication to establish a secure connection between Botpress and LinkedIn. You can configure the integration using either automatic or manual configuration methods.

### Automatic configuration with OAuth

To set up the LinkedIn integration using automatic configuration, click the authorization button and follow the on-screen instructions to connect your Botpress chatbot to LinkedIn.

When using this configuration mode, a Botpress-managed LinkedIn application will be used to connect to your LinkedIn account. Actions taken by the bot will be attributed to the LinkedIn account that authorized the connection.

#### Configuring the integration in Botpress

1. Authorize the LinkedIn integration by clicking the authorization button.
2. Follow the on-screen instructions to connect your Botpress chatbot to LinkedIn.
3. Once the connection is established, you can save the configuration and enable the integration.

### Manual configuration with OAuth

To set up the LinkedIn integration manually, you must create a LinkedIn application and configure OAuth credentials. You will also need to obtain an authorization code and configure the integration in Botpress.

#### Creating a LinkedIn Application

1. Go to the [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps).
2. Click the `Create app` button.
3. Fill in the required information:
   - App name
   - LinkedIn Page (you must associate your app with a LinkedIn Page)
   - App logo
   - Legal agreement
4. Click `Create app` to create your application.

#### Configuring OAuth Settings

1. In your LinkedIn application settings, navigate to the `Products` tab.
2. Request access to the following products:
   - `Share on LinkedIn` - Required for posting content
   - `Sign In with LinkedIn using OpenID Connect` - Required for authentication
3. Wait for approval (this may be instant or require review by LinkedIn).
4. Navigate to the `Auth` tab.
5. Under `OAuth 2.0 settings`, add the following redirect URL:
   ```
   https://webhook.botpress.cloud/oauth
   ```
6. Copy your **Client ID** and **Client Secret** for use in the next steps.

#### Authorizing the OAuth Application

1. Construct the authorization URL with your Client ID:

   ```
   https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=https://webhook.botpress.cloud/oauth&scope=openid%20profile%20email%20w_member_social&state=manual
   ```

   > Replace `YOUR_CLIENT_ID` with your actual Client ID.

2. Visit this URL in your browser while logged into the LinkedIn account you want to use with the integration.
3. Follow the on-screen instructions to authorize the application.
4. You will be redirected to `webhook.botpress.cloud`. **Do not close this page**.
5. Copy the **authorization code** from the URL in your browser's address bar.
   > The authorization code is the string that appears after `code=` in the URL.
6. You may now safely close this page.

#### Configuring the integration in Botpress

1. Select the `Manual` configuration mode in the Botpress integration settings.
2. Enter your LinkedIn **Client ID** and **Client Secret**.
3. Enter the **authorization code** you obtained in the previous step.
   > The authorization code is only valid for a short period of time. If the code has expired, you will need to repeat the authorization steps to obtain a new code.
4. Save the configuration and enable the integration.
