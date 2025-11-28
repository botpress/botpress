import { GoogleClient } from '../google-api/google-client'
import { wrapAction } from './action-wrapper'

export const composeRawEmail = wrapAction(
  { actionName: 'composeRawEmail', errorMessageWhenFailed: 'Failed to compose raw email' },
  async (
    { googleClient }: { googleClient: Awaited<ReturnType<typeof GoogleClient.create>> },
    { to, subject, body }: { to: string; subject: string; body: string }
  ) => {
    const raw = await googleClient.composeRawEmail(to, subject, body)

    return {
      raw,
    }
  }
)
