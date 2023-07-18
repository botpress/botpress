import { IntegrationDefinitionProps, messages } from "@botpress/sdk";
import { z } from "zod";

export const channels = {
  channel: {
    messages: {
      ...messages.defaults,
      html: {
        schema: z.object({
          content: z.string(),
        }),
      },
    },
    message: {
      tags: {
        id: {},
      },
    },
    conversation: {
      tags: {
        id: {},
        subject: {},
        from: {},
        toRecipients: {},
        ccRecipients: {},
        firstMessageId: {},
      },
    },
  },
} satisfies IntegrationDefinitionProps["channels"];
