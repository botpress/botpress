import type { Client } from "@botpress/client";
import type { IntegrationContext } from "@botpress/sdk";
import type { ChangeNotification } from "@microsoft/microsoft-graph-types";

import type { Config } from "../misc/types";
import type { ResourceData } from "../misc/custom-types";

import { notificationContentSchema } from "../misc/custom-schemas";

import { load as loadHtml } from "cheerio";

import { GraphApi } from "../client";

function extractMessageFromHtml(htmlContent: string): string {
  const $ = loadHtml(htmlContent);
  $("#Signature").remove();
  const message = $("body").text();

  return message;
}

export const getClient = (config: Config) =>
  new GraphApi(config.tenantId, config.clientId, config.clientSecret);

export const processMessage = async (
  message: ChangeNotification,
  ctx: IntegrationContext,
  client: Client
) => {
  const graphClient = getClient(ctx.configuration);
  if (message.lifecycleEvent) {
    console.info(`Handler received lifecycleEvent `);
    await graphClient.handleLifecycleEvents(message);
  } else if (message.resourceData) {
    const odataId = (message.resourceData as ResourceData)["@odata.id"];
    let notificationContent = notificationContentSchema.parse(
      await graphClient.getNotificationContent(odataId)
    );

    let emailbody = notificationContent.body.content;
    const sender = notificationContent.sender.emailAddress.address;

    if (notificationContent.body?.contentType === "html") {
      emailbody = extractMessageFromHtml(emailbody);
    }

    if (
      notificationContent.from?.emailAddress?.address ===
      ctx.configuration.emailAddress
    ) {
      console.warn(
        "invalid email, the email should not send itself, avoiding recursion error."
      );
      return;
    }

    const { conversation } = await client.getOrCreateConversation({
      channel: "channel",
      tags: {
        "outlook:id": JSON.stringify(notificationContent.conversationId),
        "outlook:subject": JSON.stringify(notificationContent.subject),
        "outlook:from": JSON.stringify(notificationContent.from),
        "outlook:toRecipients": JSON.stringify(
          notificationContent.toRecipients
        ),
        "outlook:ccRecipients": JSON.stringify(
          notificationContent.ccRecipients
        ),
        "outlook:firstMessageId": JSON.stringify(notificationContent.id),
      },
    });

    const { user } = await client.getOrCreateUser({
      tags: {
        "outlook:id": sender,
      },
    });

    client.setState({
      type: "conversation",
      id: conversation.id,
      name: "lastMessageRef",
      payload: {
        lastMessageId: notificationContent.id,
      },
    });

    await client.createMessage({
      tags: { "outlook:id": JSON.stringify(notificationContent.id) },
      type: "text",
      userId: user.id,
      conversationId: conversation.id,
      payload: { text: emailbody },
    });
  } else {
    console.warn("Message not supported: ", JSON.stringify(message, null, 3));
    return;
  }
};
