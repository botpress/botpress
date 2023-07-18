# Botpress Outlook Integration

This integration enables seamless email communication within your Botpress chatbot using Microsoft Outlook. It supports both text and HTML formats for composing and receiving emails. The integration is built-in and can be easily enabled by following a few simple steps.

## Prerequisites

Before enabling the Botpress Outlook Integration, please ensure that you have the following:

- A Botpress cloud account.
- Access to a Microsoft Outlook account.
- Access to Azure Portal and Azure Active Directory resource.
- Register an aplication in AD [auth-register-app-v2](https://learn.microsoft.com/en-us/graph/auth-register-app-v2)
- Assign `Mail.Read`, `Mail.Send` and `Users.Read.All`[API permissions](https://learn.microsoft.com/en-us/graph/permissions-overview?tabs=http) to your registered aplication.
- Generate certificates and secrets in [Certificates & Secrets](https://learn.microsoft.com/en-us/graph/auth-register-app-v2#add-credentials)

## Enable Integration

To enable the Outlook integration in Botpress, follow these steps:

- Access your Botpress admin panel.
- Navigate to the "Integrations" section.
- Locate the Outlook integration and click on "Enable" or "Configure."
- Provide the required Azure Active Directory credentials and configuration details shown in the "overview" section of your registered aplication.
- Save the configuration.

## Usage

Once the integration is enabled, you can start sending and receiving emails within your Botpress chatbot.

For more detailed information and examples, refer to the Botpress documentation or the Azure Active Directory documentation for configuring the integration.

## Limitations

### Rate limit exceeded for the user outlook

> This error occurs if e-mails are retrieved too often from the server or if a check is made to see whether new e-mails are present. (Each retrieval, whether new e-mails are available, is a connection to the server). If this limit is reached, the error mentioned appears and temporarily no more e-mails can be sent.

In practice this can happen if too many e-mails are sent, with several subscriptions from the same BOT. There should always be a reasonable latency between emails (normally the latency is reasonable) or use different email addresses when sending.

**Background and context:** https://learn.microsoft.com/en-us/answers/questions/1044848/message-rate-limit-exceeded

### Contributing

Contributions are welcome! If you encounter any issues or have suggestions for improvement, please submit them via the project's issue tracker. Pull requests are also appreciated.

Enjoy the seamless email integration between Botpress and Outlook!
