import { Response } from '@botpress/sdk'
import { DISABLE_INTERSTITIAL_HEADER } from './consts'

export const getInterstitialUrl = (success: boolean, message?: string) =>
  new URL(
    process.env.BP_WEBHOOK_URL?.replace('webhook', 'app') +
      `/oauth/interstitial?success=${success}${message ? `&errorMessage=${encodeURIComponent(message)}` : ''}`
  )

export const generateRedirection = (url: URL): Response => ({
  status: 303,
  headers: {
    ...DISABLE_INTERSTITIAL_HEADER,
    location: url.toString(),
  },
})
