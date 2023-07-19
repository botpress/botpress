import type { Client } from '@botpress/client';
import type { TriggerPayload } from 'src/misc/types';

export const executeMessageFromAgent = async ({
  zendeskTrigger,
  client,
}: {
  zendeskTrigger: TriggerPayload;
  client: Client;
}) => {
  await client.createEvent({
    type: 'messageFromAgent',
    payload: {
      type: zendeskTrigger.type,
      ticketId: zendeskTrigger.ticketId,
      agent: zendeskTrigger.agent,
      comment: zendeskTrigger.comment,
    },
  });
};
