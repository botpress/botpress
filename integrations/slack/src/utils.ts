import type { Request } from '@botpress/sdk'
import axios from 'axios'
import VError from 'verror'

type InteractiveBody = {
  response_url: string
  actions: {
    value?: string
    selected_option?: { value: string }
  }[]
  type: string
  channel: {
    id: string
  }
  user: {
    id: string
  }
  message: {
    ts: string
  }
}

export const isInteractiveRequest = (req: Request) => {
  // Keeping interactive_path for backward compatibility
  return req.body?.startsWith('payload=') || req.path === '/interactive'
}

export const parseInteractiveBody = (req: Request): InteractiveBody => {
  try {
    return JSON.parse(decodeURIComponent(req.body!).replace('payload=', ''))
  } catch (err) {
    throw new VError('Body is invalid for interactive request', err)
  }
}

export const respondInteractive = async (body: InteractiveBody): Promise<string> => {
  if (!body.actions.length) {
    throw new VError('No action in body')
  }

  const text = body.actions[0]?.value || body.actions[0]?.selected_option?.value
  if (text === undefined) {
    throw new VError('Action value cannot be undefined')
  }

  try {
    await axios.post(body.response_url, { text })

    return text
  } catch (err: any) {
    throw new VError(err, 'Error while responding to interactive request')
  }
}
