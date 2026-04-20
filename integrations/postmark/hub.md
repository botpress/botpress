# Postmark

Send and receive emails through [Postmark](https://postmarkapp.com) using a mail channel.

## Configuration

| Field              | Description                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------- |
| **Server Token**   | Your Postmark Server API Token. Found in your Postmark server's API Tokens tab.              |
| **From Email**     | The default sender email address. Must be a verified sender signature in Postmark.           |
| **Webhook Secret** | Optional. Shared secret used to authenticate inbound webhooks. See _Receiving emails_ below. |

## Usage

### Receiving emails

Configure a Postmark inbound webhook to point to your integration's webhook URL. Incoming emails will create conversations and messages automatically.

Conversations are keyed by the email thread, inferred from the `References` and `In-Reply-To` headers. The first email in a thread creates a new conversation; replies that share a thread root Message-ID are added to the same conversation. Subject is kept on each message's `subject` tag.

If you set a **Webhook Secret** in the integration configuration, append it to your webhook URL as a query parameter: `https://your-webhook-url?secret=YOUR_SECRET`. Requests without a matching secret will be rejected.

### Sending emails

The integration sends emails as replies to inbound conversations: messages sent to a conversation created from an inbound email are delivered to the original sender with the correct `In-Reply-To` and `References` headers to preserve threading. Bot-initiated conversations (not tied to an inbound email) are not supported.

Use the **mail** channel to send messages. All standard message types are supported:

- **Text** — sent as the email body
- **Image, Audio, Video, File** — sent as email attachments
- **Location** — sent as a Google Maps link
- **Card** — title, subtitle, action links, and optional image attachment
- **Carousel** — multiple cards separated by horizontal rules
- **Choice / Dropdown** — rendered as a numbered list
- **Bloc** — mixed content (text, media, locations) in a single email

All message types support optional `cc`, `bcc`, and `subject` fields.

## Limitations

- The integration does not track delivery events (bounces, opens, clicks).
- Bot-initiated conversations are not supported — emails can only be sent as replies to inbound messages.
