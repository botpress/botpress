import { z } from '@botpress/sdk'
import { getErrorMessage } from './errors'

export const urlSchema = z.string().transform((url, ctx) => {
  url = url.trim()
  if (!url.includes('://')) {
    url = `https://${url}`
  }
  try {
    const x = new URL(url)
    if (x.protocol !== 'http:' && x.protocol !== 'https:') {
      ctx.addIssue({
        // code: z.ZodIssueCode.custom,
        code: 'custom',
        message: 'Invalid protocol, only URLs starting with HTTP and HTTPS are supported',
      })
      return z.NEVER
    }

    if (!/.\.[a-zA-Z]{2,}$/.test(x.hostname)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Invalid TLD',
      })
      return z.NEVER
    }
    const pathName = x.pathname.endsWith('/') ? x.pathname.slice(0, -1) : x.pathname
    return `${x.origin}${pathName}`.toLowerCase()
  } catch (e) {
    ctx.addIssue({
      code: 'custom',
      message: 'Invalid URL: ' + getErrorMessage(e),
    })
    return z.NEVER
  }
})
