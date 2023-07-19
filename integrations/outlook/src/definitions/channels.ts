import { IntegrationDefinitionProps, messages } from "@botpress/sdk";

import { htmlSchema } from "../misc/custom-schemas";

const { text, choice, dropdown } = messages.defaults;
const messageTags = { id: {} };
const conversationTags = {
  id: {},
  subject: {},
  from: {},
  toRecipients: {},
  ccRecipients: {},
  firstMessageId: {},
};

export const channels = {
  channel: {
    messages: {
      text,
      choice,
      dropdown,
      html: {
        schema: htmlSchema,
      },
    },
    message: {
      tags: messageTags,
    },
    conversation: {
      tags: conversationTags,
    },
  },
} satisfies IntegrationDefinitionProps["channels"];
