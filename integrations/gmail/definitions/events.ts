import * as sdk from '@botpress/sdk'
import { z } from '@botpress/sdk'

export const ping = {
    title: "ping",
    description: "a test event",
    schema: z.object({
        description: z.string().title("description").describe("Just a test event")
    })
}

<<<<<<< HEAD
export const emailReceived = {
    title: "Email Received",
    description: "Triggered when a new email is received",
    schema: z.object({
        messageId: z.string().title("Message ID").describe("Gmail message ID"),
        threadId: z.string().title("Thread ID").describe("Gmail thread ID"),
        subject: z.string().title("Subject").describe("Email subject"),
        from: z.string().title("From").describe("Sender email address"),
        senderName: z.string().title("Sender Name").describe("Sender display name"),
        to: z.string().optional().title("To").describe("Recipient email address"),
        cc: z.string().optional().title("CC").describe("CC recipients"),
        bcc: z.string().optional().title("BCC").describe("BCC recipients"),
        date: z.string().optional().title("Date").describe("Email date"),
        content: z.string().title("Content").describe("Email content (plain text)"),
        snippet: z.string().optional().title("Snippet").describe("Email snippet"),
        inReplyTo: z.string().optional().title("In Reply To").describe("Message ID this email is replying to"),
        references: z.string().optional().title("References").describe("Email references header"),
        labelIds: z.array(z.string()).title("Label IDs").describe("Gmail label IDs"),
        isUnread: z.boolean().title("Is Unread").describe("Whether the email is unread"),
    })
}

export const events = {
    ping,
    emailReceived
=======
export const events = {
    ping
>>>>>>> e15b53e4 (ping event)
} as const satisfies sdk.IntegrationDefinitionProps['events']
