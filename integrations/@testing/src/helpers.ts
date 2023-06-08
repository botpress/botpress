import {
  botIdHeader,
  botUserIdHeader,
  configurationHeader,
  integrationIdHeader,
  operationHeader,
  webhookIdHeader,
} from '@botpress/sdk'
/* eslint-disable no-duplicate-imports */
import type { IntegrationContext, Request } from '@botpress/sdk'
import { v4 } from 'uuid'

export function generateContext<TConfiguration>(
  operation: IntegrationContext<TConfiguration>['operation']
): IntegrationContext<TConfiguration> {
  return {
    operation,
    botId: v4(),
    botUserId: v4(),
    integrationId: v4(),
    webhookId: v4(),
    configuration: {
      isJsonMime: (mime: string) => mime === 'application/json',
    } as any,
  }
}

export function buildRequest<TConfiguration>(ctx: IntegrationContext<TConfiguration>, body: any): Request {
  const req: Request = {
    path: '/',
    method: 'POST',
    query: '',
    headers: {},
  }

  const internalReq: Request = {
    ...req,
    body: JSON.stringify(body),
  }

  return {
    path: req.path,
    method: req.method,
    query: req.query,
    headers: {
      [botIdHeader]: ctx.botId,
      [botUserIdHeader]: ctx.botUserId,
      [integrationIdHeader]: ctx.integrationId,
      [webhookIdHeader]: ctx.webhookId,
      [operationHeader]: ctx.operation,
      [configurationHeader]: Buffer.from(JSON.stringify(ctx.configuration)).toString('base64'),
    },
    body: JSON.stringify({
      req: internalReq,
    }),
  }
}
