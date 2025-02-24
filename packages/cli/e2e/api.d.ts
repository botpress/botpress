import { Client } from '@botpress/client';
export type ApiBot = Awaited<ReturnType<Client['listBots']>>['bots'][0];
export declare const fetchAllBots: (client: Client) => Promise<ApiBot[]>;
export type ApiIntegration = Awaited<ReturnType<Client['listIntegrations']>>['integrations'][0];
export declare const fetchAllIntegrations: (client: Client) => Promise<ApiIntegration[]>;
