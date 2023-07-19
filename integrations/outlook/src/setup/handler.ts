import type { ChangeNotification } from '@microsoft/microsoft-graph-types'
import querystring from 'querystring'
import type { Handler } from '../misc/types'

import { processMessage } from '../utils'

export const handler: Handler = async ({ req, ctx, client }) => {
  // If there is a validationToken parameter
  // in the query string, this is the endpoint validation
  // request sent by Microsoft Graph. Return the token
  // as plain text with a 200 response
  // https://docs.microsoft.com/graph/webhooks#notification-endpoint-validation
  if (req.query) {
    const queryParams = querystring.parse(req.query)
    const validationToken = queryParams.validationToken

    if (validationToken) {
      const str = decodeURIComponent(validationToken as string)
        .split('+')
        .join(' ')
      return {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
        body: str,
      }
    }
  }

  if (!req.body) {
    console.warn('Handler received an empty body')
    return
  }

  const body: { value: ChangeNotification[] | undefined } = JSON.parse(req.body)
  if (!body.value) {
    console.warn('Missing property value in the body')
    return
  }

  for (const message of body.value) {
    await processMessage(message, ctx, client)
  }

  return
}
