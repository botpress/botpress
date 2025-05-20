Simplify your email communication and supercharge your chatbot with seamless integration between Botpress and Gmail. Experience the power of combining your AI-powered chatbot with the versatility of Gmail, empowering you to streamline workflows, automate tasks, and deliver exceptional customer experiences. Unlock a world of possibilities as your chatbot seamlessly interacts with your Gmail inbox, managing emails, composing messages, and executing actions with ease. Leverage Gmail's robust features, such as advanced search, labeling, and filtering, to efficiently organize and respond to emails. Elevate your chatbot's capabilities and revolutionize your email-based interactions with the Botpress and Gmail Integration.

## Important note

Unfortunately, **automatic configuration is temporarily unavailable**.
We are currently in the process of getting our Gmail integration verified by Google. Once this verification is complete, you will be able to use the automatic configuration method to set up the Gmail integration with just a few clicks. Until then, you will need to create your own OAuth app by following the steps outlined in the `Manual configuration with OAuth` section below.

## Configuration

Due to the sensitive nature of email communication, the Gmail integration requires a secure connection between Botpress and Gmail. To establish this secure connection, you **must** configure the Gmail integration using OAuth.

### Automatic configuration with OAuth

To set up the Gmail integration using OAuth, click the authorization button and follow the on-screen instructions to connect your Botpress chatbot to Gmail.

When using this configuration mode, a Botpress-managed Gmail application will be used to connect to your Gmail account. However, actions taken by the bot will be attributed to the user who authorized the connection, rather than the application. For this reason, **we do not recommend using personal Gmail accounts** for this integration. You should set up a service account and use this account to authorize the connection.

#### Configuring the integration in Botpress

1. Authorize the Gmail integration by clicking the authorization button.
2. Follow the on-screen instructions to connect your Botpress chatbot to Gmail.
3. Once the connection is established, you can save the configuration and enable the integration.

### Manual configuration with OAuth

To set up the Gmail integration manually, you must create a Google Cloud Platform project and enable the Gmail API. You will also need to create OAuth credentials, set up a Pub/Sub topic, and configure the integration in Botpress.

#### Creating a Google Cloud Platform project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project by clicking the `Select a resource` dropdown in the top navigation bar and selecting `New Project`.
3. Follow the on-screen instructions to create the new project.

#### Enabling the Gmail API

1. In the Google Cloud Console, navigate to the `APIs & Services` section.
2. Click on `Library` in the left sidebar.
3. Search for `Gmail API` and click on the result.
4. Click the `Enable` button to enable the Gmail API for your project.

#### Configuring the OAuth consent screen

1. In the Google Cloud Console, navigate to the `APIs & Services` section.
2. Click on `OAuth consent screen` in the left sidebar.
3. Select `External` as the user type and click the `Create` button.
4. Enter a name for your application and fill in the other required fields.
5. Click the `Save and continue` button.
6. Click the `Add or remove scopes` button.
7. Under `Manually add scopes`, enter the following:

   ```plaintext
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.send
   ```

8. Click the `Add to table` button, followed by the `Update` button.
9. Click the `Save and continue` button.
10. Under `Test users`, enter the email address of the user you would like to use with the integration.
11. Click the `Save and continue` button again.
12. Click the `Back to dashboard` button.

#### Creating OAuth credentials

1. In the Google Cloud Console, navigate to the `APIs & Services` section.
2. Click on `Credentials` in the left sidebar.
3. Click the `Create credentials` dropdown and select `OAuth client ID`.
4. Select `Web application` as the application type.
5. Enter a name for the OAuth client ID.
6. Under `Authorized redirect URIs`, enter `https://botpress.com`.
7. Click the `Create` button to create the OAuth client ID.
8. Copy the **client ID** and **client secret** for use in the next steps.
   > The client ID is the string that ends with `.apps.googleusercontent.com`.

#### Creating a service account

1. In the Google Cloud Console, navigate to the `IAM & Admin` section.
2. Click on `Service accounts` in the left sidebar.
3. Click the `Create service account` button.
4. Enter a name for the service account.
5. Click the `Done` button to create the service account.
   > There is no need to grant any roles to the service account, as it will only be used to sign webhook events.
6. Copy the **service account email address** for use in the next steps.
   > The service account email address is the string that ends with `.gserviceaccount.com`.

#### Creating a Pub/Sub topic

1. In the Google Cloud Console, navigate to the `Pub/Sub` section.
2. Click on `Topics` in the left sidebar.
3. Click the `Create topic` button.
4. Enter a name for the topic in the `Topic ID` field.
5. Unckeck the `Add default subscription` checkbox.
6. Leave the other options unchanged.
7. Click the `Create` button to create the topic.
8. Copy the **topic name** for use in the next steps.
   > The topic name is the string that starts with `projects/`.

#### Granting publish rights on the Pub/Sub topic

1. In the Google Cloud Console, navigate to the `Pub/Sub` section.
2. Click on `Topics` in the left sidebar.
3. From the topic list, find the topic you created earlier and click the triple-dot <kbd>⋮</kbd> button to the far right.
4. Select `View permissions` from the dropdown menu.
5. Click the `Add principal` button.
6. Under `Add principals`, enter `gmail-api-push@system.gserviceaccount.com`.
   > This service account is managed by Google and is used to push events to Pub/Sub.
7. Under `Assign roles`, select the role `Pub/Sub Publisher`.
8. Click the `Save` button to grant publish rights to the service account.

#### Generating a shared secret

1. Generate an alphanumeric string to use as a shared secret for signing Pub/Sub push events. We recommend using a string with at least 32 characters. You can use tools like openssl or online password generators to create a secure string.

   - For example, you can generate a secure string using one the following commands:

     ```bash
     # Using openssl:
     openssl rand -hex 32

     # Using nodejs:
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

     # Using Python 3:
     python3 -c "import secrets; print(secrets.token_hex(32))"
     ```

   - You may also use an online password generator to create a secure string:
     - https://bitwarden.com/password-generator/
     - https://1password.com/password-generator

2. Copy the **shared secret** for use in the next steps.

#### Creating a Pub/Sub subscription

1. In the Google Cloud Console, navigate to the `Pub/Sub` section.
2. Click on `Subscriptions` in the left sidebar.
3. Click the `Create subscription` button.
4. Enter a name for the subscription in the `Subscription ID` field.
5. Select the topic you created earlier from the `Topic` dropdown.
6. Under `Delivery type`, select `Push`.
7. Enter your integration's Botpress-provided webhook URL in the `Endpoint URL` field. To this URL, append `?shared_secret=`, followed by the shared secret you generated earlier.
   > For example, if your integration's webhook URL is `https://webhook.botpress.cloud/57fcfb04-51fd-4381-909a-10e6ae53d310`, the endpoint URL would be `https://webhook.botpress.cloud/57fcfb04-51fd-4381-909a-10e6ae53d310?shared_secret=your_shared_secret`.
8. Check the `Enable authentication` checkbox.
9. Enter the service account email address you created earlier in the `Service account` field.
10. Enter the shared secret you generated earlier in the `Audience` field.
11. Under `Expiration period`, select `Never expire`.
12. Under `Acknowledgement deadline`, enter `60` seconds.
13. Under `Retry policy`, select `Retry after exponential backoff delay`. Set the minimum backoff to `60` second and the maximum backoff to `600` seconds.
14. Click the `Create` button to create the subscription.

#### Authorizing the OAuth application

1. On Gmail, log in to the Google account you want to use with the Gmail integration.
2. Once logged in, go to the following URL in your browser:

   ```
   https://accounts.google.com/o/oauth2/auth?response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly%20https://www.googleapis.com/auth/gmail.send&access_type=offline&prompt=consent&redirect_uri=https://botpress.com&client_id=
   ```

   > Make sure to add your OAuth **client ID** to the end of the URL. For example, if your OAuth client ID is `abcd`, the URL should end with `&client_id=abcd`.

3. Follow the on-screen instructions to authorize the OAuth application with your personal Gmail account.
4. You will be redirected to botpress.com. **Do not close this page**.
5. Copy the **authorization code** from the URL in your browser's address bar.
   > The authorization code is the string that appears after `code=` and before `&scope=` in the URL.
   > If you have difficulty finding the authorization code in the URL, you may use online tools such as https://semalt.tools/en/url-parser or https://parseurlonline.com.
6. You may now safely close this page.

#### Configuring the integration in Botpress

1. Select the `Manual` configuration mode in the Botpress integration settings.
2. Enter your OAuth **client ID** and **client secret**.
3. Enter the full **topic name**, which starts with `projects/`.
4. Enter the **shared secret** you generated earlier.
5. Enter the **service account email address** you created earlier.
6. Enter the **authorization code** you obtained earlier.
   > Unfortunately, the authorization code is only valid for a short period of time. If the code has expired, you will need to repeat the steps outlined in the `Authorizing the OAuth application` section. If the authorization code is not expired, it will be exchanged for a refresh token, which will be used to authenticate the integration.
7. Save the configuration and enable the integration.

## Limitations

Botpress shall not be held responsible for any costs you may incur on the Google Cloud Platform while using the Gmail integration, should you choose to use the manual configuration mode. Ensure that you are aware of the costs associated with using the Gmail API and the Google Cloud Platform before using the manual configuration mode.

Standard Gmail API limitations apply to the Gmail integration in Botpress. These limitations include rate limits, message size restrictions, and other constraints imposed by the Gmail and Google Cloud platforms. Ensure that your chatbot adheres to these limitations to maintain optimal performance and reliability.

More details are available in the [Gmail API documentation](https://developers.google.com/gmail/api/reference/quota).
