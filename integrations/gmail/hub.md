Simplify your email communication and supercharge your chatbot with seamless integration between Botpress and Gmail. Experience the power of combining your AI-powered chatbot with the versatility of Gmail, empowering you to streamline workflows, automate tasks, and deliver exceptional customer experiences. Unlock a world of possibilities as your chatbot seamlessly interacts with your Gmail inbox, managing emails, composing messages, and executing actions with ease. Leverage Gmail's robust features, such as advanced search, labeling, and filtering, to efficiently organize and respond to emails. Elevate your chatbot's capabilities and revolutionize your email-based interactions with the Botpress and Gmail Integration.

## Configuration

Due to the sensitive nature of email communication, the Gmail integration requires a secure connection between Botpress and Gmail. To establish this secure connection, you **must** configure the Gmail integration using OAuth.

### Automatic configuration with OAuth

To set up the Gmail integration using OAuth, click the authorization button and follow the on-screen instructions to connect your Botpress chatbot to Gmail.

When using this configuration mode, a Botpress-managed Gmail application will be used to connect to your Gmail account. However, actions taken by the bot will be attributed to the user who authorized the connection, rather than the application. For this reason, **we do not recommend using personal Gmail accounts** for this integration. You should set up a service account and use this account to authorize the connection.

### Configuring the integration in Botpress

1. Authorize the Gmail integration by clicking the authorization button.
2. Follow the on-screen instructions to connect your Botpress chatbot to Gmail.
3. Once the connection is established, you can save the configuration and enable the integration.

## Limitations

Standard Gmail API limitations apply to the Gmail integration in Botpress. These limitations include rate limits, message size restrictions, and other constraints imposed by the Gmail platform. Ensure that your chatbot adheres to these limitations to maintain optimal performance and reliability.

More details are available in the [Gmail API documentation](https://developers.google.com/gmail/api/reference/quota).
