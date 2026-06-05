import { z } from '@botpress/sdk'
import { DATA_CENTERS } from './data-centers'

export const zohoTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  api_domain: z.string().optional(),
  expires_in: z.number().optional(),
})

export const zohoCredentialsStateSchema = z.object({
  accessToken: z.string().title('Access Token').describe('Your Zoho Access Token'),
  refreshToken: z.string().optional().title('Refresh Token').describe('Your Zoho Refresh Token'),
  dataCenter: z.enum(DATA_CENTERS).optional().title('Data Center Region').describe('Zoho Data Center Region'),
  apiDomain: z.string().optional().title('API Domain').describe('Zoho API domain returned by OAuth'),
  expiresAt: z.number().optional().title('Expiration Timestamp').describe('Access token expiration timestamp'),
})

export const zohoOAuthWizardStateSchema = z.object({
  dataCenter: z
    .enum(DATA_CENTERS)
    .title('Data Center Region')
    .describe('Zoho Data Center Region selected during OAuth setup'),
})
