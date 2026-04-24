import { z } from '@botpress/sdk'

export { actions } from './actions'
export { events } from './events'
export { states } from './states'
export * as schemas from './schemas'

export const configuration = {
  identifier: {
    linkTemplateScript: 'linkTemplate.vrl',
  },
  schema: z.object({}),
}

export const secrets = {
  SHOPIFY_CLIENT_ID: { description: 'The Client ID of the Shopify app' },
  SHOPIFY_CLIENT_SECRET: { description: 'The Client Secret of the Shopify app' },
}
