import { type HandlerProps } from '.botpress'

const ACCESS_CONTROL_ALLOW_ORIGIN = 'Access-Control-Allow-Origin'

export const getCorsHeaders = (args: HandlerProps): Record<string, string> => {
  const { allowedOrigins } = args.ctx.configuration

  if (!allowedOrigins || allowedOrigins.length === 0) {
    return {
      [ACCESS_CONTROL_ALLOW_ORIGIN]: '',
    }
  }

  const reqOrigin = args.req.headers.origin

  if (!reqOrigin) {
    return {
      [ACCESS_CONTROL_ALLOW_ORIGIN]: '',
    }
  }

  if (allowedOrigins.includes(reqOrigin)) {
    return {
      [ACCESS_CONTROL_ALLOW_ORIGIN]: reqOrigin,
    }
  }

  if (allowedOrigins.includes('*')) {
    return {
      [ACCESS_CONTROL_ALLOW_ORIGIN]: reqOrigin,
    }
  }

  return {
    [ACCESS_CONTROL_ALLOW_ORIGIN]: '',
  }
}
