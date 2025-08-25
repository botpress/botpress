import { wrapAction } from '../action-wrapper'

export const getMyEmail = wrapAction(
  { actionName: 'getMyEmail', errorMessage: 'Failed to get email' },
  async ({ googleClient }, _) => {
    const email = await googleClient.getMyEmail()
    console.info(`got the email: ${email}`)
    if (!email) {
      throw new Error('Unable to retrieve email address')
    }
    return { emailAddress: email }
  }
)
