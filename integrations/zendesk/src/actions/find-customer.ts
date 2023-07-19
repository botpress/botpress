import type * as botpress from '.botpress';
import type { Implementation, Customer } from '../misc/types';
import { ZendeskApi } from '../client';

type Config = botpress.configuration.Configuration;

const getClient = (config: Config) =>
  new ZendeskApi(config.baseURL, config.username, config.apiToken);

export const findCustomer: Implementation['actions']['findCustomer'] = async ({
  ctx,
  input,
}) => {
  const zendeskClient = getClient(ctx.configuration);

  const customers: Customer[] = [];

  try {
    const list = await zendeskClient.findCustomers(input.query);
    customers.push(...list);
  } catch (error) {
    console.warn(error.message);
  }

  return {
    customers,
  };
};
