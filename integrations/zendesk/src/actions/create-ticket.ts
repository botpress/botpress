import type * as botpress from '.botpress';
import type { Implementation } from '../misc/types';
import { ZendeskApi } from '../client';

type Config = botpress.configuration.Configuration;

const getClient = (config: Config) =>
  new ZendeskApi(config.baseURL, config.username, config.apiToken);

export const createTicket: Implementation['actions']['createTicket'] = async ({
  ctx,
  input,
}) => {
  const zendeskClient = getClient(ctx.configuration);
  const ticket = await zendeskClient.createTicket(
    input.subject,
    input.comment,
    { name: input.requesterName, email: input.requesterEmail }
  );
  return {
    ticket,
  };
};
