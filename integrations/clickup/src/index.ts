import * as sdk from "@botpress/sdk";
import * as bp from ".botpress";
import { ClickUpClient } from "./client";

export default new bp.Integration({
  register: async ({ ctx, logger, webhookUrl }) => {
    logger.forBot().info("ClickUp integration enabled");
    const clickup = new ClickUpClient(ctx.configuration.apiKey, ctx.configuration.teamId);

    // Fetching the user to make sure we have access to click up before registering the webhook.
    await clickup.getUser();
    await setWebhook(clickup, webhookUrl);
  },
  unregister: async () => {},
  actions: {
    createTask: async ({ input, ctx, logger }) => {
      try {
        const clickup = new ClickUpClient(ctx.configuration.apiKey, ctx.configuration.teamId);
        const { dueDate, ...rest } = input;
        const task = await clickup.createTask({ ...rest, dueDate: dueDate ? new Date(dueDate).getTime() : undefined });
        return { taskId: task.id.toString() };
      } catch (e: any) {
        logger.forBot().error(e.stack);
        throw new sdk.RuntimeError("Error while running the 'Create task' action", e);
      }
    },

    updateTask: async ({ input, ctx, logger }) => {
      try {
        const clickup = new ClickUpClient(ctx.configuration.apiKey, ctx.configuration.teamId);
        const { dueDate, assigneesToAdd, assigneesToRemove, ...rest } = input;
        const task = await clickup.updateTask({ 
          ...rest, 
          assignees: {add: assigneesToAdd ?? [], rem: assigneesToRemove ?? []}, 
          dueDate: dueDate ? new Date(dueDate).getTime() : undefined });
        return { taskId: task.id.toString() };
      } catch (e: any) {
        logger.forBot().error(e.stack);
        throw new sdk.RuntimeError("Error while running the 'Update task' action", e);
      }
    },

    deleteTask: async ({ input, ctx, logger }) => {
      try {
        const clickup = new ClickUpClient(ctx.configuration.apiKey, ctx.configuration.teamId);
        await clickup.deleteTask(input);
        return {};
      } catch (e: any) {
        logger.forBot().error(e.stack);
        throw new sdk.RuntimeError("Error while running the 'Delete task' action", e);
      }
    },

    getListMembers: async ({ input, ctx, logger }) => {
      try {
        const clickup = new ClickUpClient(ctx.configuration.apiKey, ctx.configuration.teamId);
        const members = await clickup.getListMembers(input);
        return { members };
      } catch (e: any) {
        logger.forBot().error(e.stack);
        throw new sdk.RuntimeError("Error while running the 'Get list members' action", e);
      }
    }
  },

  channels: {
    comment: {
      messages: {
        text: async ({ ctx, payload, ack, conversation }) => {
          const clickup = new ClickUpClient(ctx.configuration.apiKey, ctx.configuration.teamId);
          const comment = await clickup.createComment({ text: payload.text, taskId: conversation.tags.taskId! });
          await ack({ tags: { id: comment.id.toString() } });
        },
      },
    },
  },

  handler: async ({ req, ctx, client, logger }) => {
    if (!req.body) return;

    const clickup = new ClickUpClient(ctx.configuration.apiKey, ctx.configuration.teamId);

    const body = JSON.parse(req.body);
    if (body.event === "taskCommentPosted") {
      const botUser = await clickup.getUser();

      for (const historyItem of body.history_items) {
        if (botUser.id === historyItem.user.id) continue;

        const { user } = await client.getOrCreateUser({ tags: { id: historyItem.user.id.toString() } });
        const { conversation } = await client.getOrCreateConversation({
          tags: { taskId: body.task_id.toString() },
          channel: "comment",
        });
        const { message } = await client.getOrCreateMessage({
          conversationId: conversation.id,
          userId: user.id,
          type: "text",
          payload: { text: historyItem.comment.text_content },
          tags: { id: historyItem.comment.id.toString() },
        });

        logger.forBot().info("Message created", message.payload.text);
      }
    } else if (body.event === "taskCreated") {
      await client.createEvent({ type: "taskCreated", payload: { id: body.task_id.toString() } });
    } else if (body.event === "taskUpdated") {
      await client.createEvent({ type: "taskUpdated", payload: { id: body.task_id.toString() } });
    } else if (body.event === "taskDeleted") {
      await client.createEvent({ type: "taskDeleted", payload: { id: body.task_id.toString() } });
    }
  },
});

async function setWebhook(clickup: ClickUpClient, webhookUrl: string) {
  const webhooks = await clickup.listWebhooks();
  const events = ["taskCommentPosted", "taskCreated", "taskUpdated", "taskDeleted"];

  for (const webhook of webhooks) {
    if (webhook.endpoint === webhookUrl) {
      await clickup.updateWebhook({
        endpoint: webhookUrl,
        status: "active",
        webhookId: webhook.id,
        events: events,
      });
      return;
    }
  }
  await clickup.createWebhook({
    endpoint: webhookUrl,
    events: events,
  });
}
