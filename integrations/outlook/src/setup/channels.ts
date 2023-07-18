import type { Channels } from "../misc/types";

import { getClient } from "../utils";

class NotImplementedError extends Error {
  constructor() {
    super("Not implemented");
  }
}

export const channels: Channels = {
  channel: {
    messages: {
      text: async (props) => {
        const graphClient = getClient(props.ctx.configuration);
        await graphClient.sendMail({
          ...props,
          body: {
            contentType: "text",
            content: `${props.payload.text}\n\n${props.ctx.configuration.emailSignature}`,
          },
        });
      },
      image: async () => {
        throw new NotImplementedError();
      },
      markdown: async () => {
        throw new NotImplementedError();
      },
      audio: async () => {
        throw new NotImplementedError();
      },
      video: async () => {
        throw new NotImplementedError();
      },
      file: async () => {
        throw new NotImplementedError();
      },
      location: async () => {
        throw new NotImplementedError();
      },
      carousel: async () => {
        throw new NotImplementedError();
      },
      card: async () => {
        throw new NotImplementedError();
      },
      choice: async (props) => {
        const graphClient = getClient(props.ctx.configuration);
        let content = `${props.payload.text}\n`;

        for (const option of props.payload.options) {
          content += `- ${option.label}\n`;
        }
        content += `\n\n${props.ctx.configuration.emailSignature}`;
        await graphClient.sendMail({
          ...props,
          body: {
            contentType: "text",
            content,
          },
        });
      },
      dropdown: async (props) => {
        const graphClient = getClient(props.ctx.configuration);
        let content = `${props.payload.text}\n`;

        for (const option of props.payload.options) {
          content += `- ${option.label}\n`;
        }
        content += `\n\n${props.ctx.configuration.emailSignature}`;
        await graphClient.sendMail({
          ...props,
          body: {
            contentType: "text",
            content,
          },
        });
      },
      html: async (props) => {
        const graphClient = getClient(props.ctx.configuration);
        await graphClient.sendMail({
          ...props,
          body: {
            contentType: "html",
            content: props.payload.content,
          },
        });
      },
    },
  },
};
