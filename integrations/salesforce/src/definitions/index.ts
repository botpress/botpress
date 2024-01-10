import z from 'zod'

import { actions } from './actions'
import { channels } from './channels'

export { actions }
export { channels }

export const configuration = {
  schema: z.object({
    SFLoginURL: z
      .string()
      .optional()
      .default('https://login.salesforce.com')
      .describe('Login URL for Salesforce, excluding trailing (default: https://login.salesforce.com)'),
    email: z.string().describe('Email to use to connect to Salesforce'),
    password: z.string().describe('Password to use to connect to Salesforce'),
    securityToken: z
      .string()
      .describe(
        'Security Token to use to connect to Salesforce, available under account settings in the salesforce Web UI'
      ),
    apiVersion: z
      .string()
      .optional()
      .default('42.0')
      .describe('What Salesforce API version to use, must be a string without the "v" in front (default: 42.0)'),
  }),
}

export const states = {}

export const user = {
  tags: {},
}
