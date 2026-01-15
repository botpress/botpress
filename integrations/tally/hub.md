# Tally Integration

Connect your Botpress chatbot with **Tally**, a powerful online form builder, and receive form submissions directly in your bot.

## Configuration

### Prerequisites

Before enabling the Botpress Tally integration, make sure you have:

- A **Botpress Cloud** account
- A **Tally API key**
- The **Form ID** of the Tally form you want to connect to your bot

### Enable the Integration

To enable the Tally integration in Botpress:

1. Open your **Botpress Admin Panel**
2. Go to the **Integrations** section
3. Find **Tally** and click **Enable** or **Configure**
4. Enter your **Tally API key**
5. Enter the **Form ID**
6. Save the configuration

Botpress will automatically register a webhook on Tally for the selected form.

## Usage

Once the integration is enabled, your bot can react to events sent by Tally.

### Supported Events

- **Form Submitted**
  Triggered when the configured Tally form is submitted.
