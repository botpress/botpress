Streamline your development workflow by seamlessly integrating GitHub with Botpress, the open-source conversational AI platform. This integration enables you to effortlessly manage and automate your GitHub repositories, issues, and pull requests directly from Botpress, empowering you to collaborate effectively, track progress, and ensure smooth development cycles. Take advantage of powerful features like real-time notifications, issue management, pull request merging, and more, all within the familiar Botpress environment. Boost productivity, streamline collaboration, and unleash the full potential of your conversational AI projects with the GitHub Integration for Botpress.

## Migrating from version `0.x` to `1.x`

Version `1.0` of the GitHub integration introduces several changes and improvements over the previous version. If you are migrating from version `0.x` to `1.x`, please note the following changes:

> The integration now supports both GitHub Apps and personal access tokens for authentication. GitHub Apps are recommended for organizations, while personal access tokens are suitable for individual users. If you wish to continue using a personal access token, you must enable fine-grained personal access tokens for your organization on GitHub. For more information on setting up the integration with a personal access token, refer to the "[manual configuration with a personal access token](#manual-configuration-with-a-personal-access-token-not-recommended)" section.

> The "Find Target" action now requires the `repo` field to be specified. This field should contain the name of the repository. Furthermore, the `discussion` channel was removed from this action, as it was not implemented and did nothing.

> The `number` tag on channels has been removed. Instead, pull requests have a `pullRequestNumber` tag, and issues have an `issueNumber` tag.

## Configuration

### Automatic configuration with OAuth (recommended)

This is the simplest way to set up the integration. To set up the GitHub integration using OAuth, click the authorization button and follow the instructions to connect your Botpress chatbot to GitHub. This method is recommended as it simplifies the configuration process and ensures secure communication between your chatbot and GitHub.

When using this configuration mode, a Botpress-managed GitHub application will be used to connect to your GitHub organizations and repositories. The application will have the necessary permissions to listen to pull request and issue events and to create new comments on issues, pull requests and discussions. If you require more granular control over the permissions or prefer to use your own GitHub application, you can opt for the manual configuration mode instead.

### Manual configuration with a custom GitHub App

If you prefer to manually configure the integration, you can connect your own GitHub application to Botpress. To set up the GitHub integration manually, follow these steps:

1. In the integration settings, copy the webhook URL provided to you by Botpress.
2. On GitHub, navigate to your organization's settings page.
3. Under the "Developer settings" section, click on "GitHub Apps" and then click the "New GitHub App" button.
4. Fill in the required fields to create a new GitHub App. You can customize the app's name, description, homepage URL, and other settings as needed.
5. In the "Webhook" section, paste the webhook URL provided by Botpress into the "Webhook URL" field.
6. Use a password generator or other secure method to generate a high entropy string to be used as your GitHub App's webhook secret key. The secret key will be used to sign the payloads sent to your webhook URL. Make sure to keep this key secure and do not share it with others.
7. Paste the secret key into the "Webhook Secret" field on GitHub. Make sure to keep this key secure and do not share it with others.
8. Paste the same key into the "GitHub Webhook Secret" field in the Botpress integration settings.
9. Configure the permissions for your GitHub App as needed:

- Repository Permissions:
  - `Discussions`: select the "Read & write" permission to allow the bot to read and create comments on discussions.
  - `Issues`: select the "Read & write" permission to allow the bot to read and create comments on issues.
  - `Pull requests`: select the "Read & write" permission to allow the bot to read and create comments on pull requests.
- Organization Permissions:
  - `Team discussions`: select the "Read & write" permission to allow the bot to read and create comments on team discussions.

10. Depending on the permissions you choose to grant, you may now subscribe to webhook events as needed:

- `Discussion`
- `Discussion comment`
- `Issues`
- `Issue comment`
- `Pull request`
- `Pull request review`
- `Pull request review comment`
- `Pull request review thread`

11. Save the changes on GitHub.
12. In your newly created GitHub App, navigate to the "General" tab and generate a new private key. Save the private key to a secure location.
13. In the integration settings, paste the contents of the private key file you downloaded from GitHub into the "GitHub App Private Key" field.
14. On GitHub, in the "General" tab of your GitHub App, copy the App ID and paste it into the "GitHub App ID" field in the Botpress integration settings.
15. Install the GitHub App on your organization's repositories as needed.
16. Once the GitHub App is installed, navigate to your organization's installed GitHub Apps page and click on the newly installed GitHub App.
17. The URL of the page should end with `/installations/:installation_id`. For example, in the URL `https://github.com/organizations/.../settings/installations/123456`, the installation ID is `123456`. Copy the installation ID and paste it into the "GitHub App Installation ID" field in the Botpress integration settings.
18. Save the configuration in Botpress and enable the integration.

## Manual configuration with a personal access token (not recommended)

If you prefer to manually configure the integration, you can provide a personal access token to connect your personal GitHub account to Botpress. Keep in mind that when you use a personal access token, actions taken by the bot will be attributed to your personal GitHub account. If you wish for actions to be attributed to your organization instead of to your personal account, you must use a GitHub App. GitHub applications offer a lot of advantages over personal access tokens and do not consume a seat within your GitHub organization. As such, we do not recommend using personal access tokens.

To set up the GitHub integration using a personal access token, follow these steps:

### Enabling personal access tokens for your organization

1. On GitHub, navigate to the settings page of your organization.
2. Under the "Third-party Access" section, click on "Personal access tokens".
3. In the setup page, select "Allow access via fine-grained personal access tokens".
4. Go through the rest of the setup process to enable fine-grained personal access tokens for your organization. It is not necessary to enable _classic_ personal access tokens.

### Subscribing to webhook events at the org level

1. On Botpress, in the integration settings, copy the webhook URL provided to you by Botpress.
2. Navigate to your organization's settings page on GitHub.
3. Under the "Webhooks" section, click on "Add webhook".
4. Paste the webhook URL provided by Botpress into the "Payload URL" field.
5. Select the `application/json` content type.
6. Use a password generator or other secure method to generate a high entropy string to be used as your webhook secret key. The secret key will be used to sign the payloads sent to your webhook URL. Make sure to keep this key secure and do not share it with others.
7. Paste the secret key into the "Secret" field on GitHub
8. Choose "Let me select individual events" and select the following events:

- `Discussion`
- `Discussion comment`
- `Issues`
- `Issue comment`
- `Pull request`
- `Pull request review`
- `Pull request review comment`
- `Pull request review thread`

9. Save the webhook on GitHub.

### Creating an organization-level personal access token

1. On GitHub, navigate to your account settings page.
2. Under the "Developer settings" section, click on "Personal access tokens" and then choose "Fine-grained tokens".
3. Click the "Generate new token" button and provide a name and description for the token.
4. Select your organization as the resource owner for the token.
5. Choose a sufficient expiration date for the token. You will need to regenerate the token and update your integration settings accordingly when it expires.
6. Under "Repository access", select the repositories you want the bot to have access to. Please note that if you choose "Public Repositories", the bot will not be able to reply to issues or pull requests.
7. Configure the permissions for your personal access token as needed:

- Repository Permissions:
  - `Discussions`: select the "Read & write" permission to allow the bot to read and create comments on discussions.
  - `Issues`: select the "Read & write" permission to allow the bot to read and create comments on issues.
  - `Pull requests`: select the "Read & write" permission to allow the bot to read and create comments on pull requests.
- Organization Permissions:
  - `Team discussions`: select the "Read & write" permission to allow the bot to read and create comments on team discussions.

8. Generate your personal access token and copy it to a secure location.

### Configuring the integration in Botpress

1. In the integration settings, paste the personal access token you generated into the "GitHub Personal Access Token" field.
2. Paste the webhook secret key you generated into the "GitHub Webhook Secret" field.
3. Save the configuration in Botpress and enable the integration.

## Limitations

Standard GitHub API limitations apply to the GitHub integration in Botpress. These limitations include rate limits, message size restrictions, and other constraints imposed by the GitHub platform. Ensure that your chatbot adheres to these limitations to maintain optimal performance and reliability.

More details are available in the [GitHub API documentation](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api).
