import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'

export const getUserProfile = wrapActionAndInjectSlackClient(
  { actionName: 'getUserProfile', errorMessage: 'Failed to retrieve user profile' },
  async ({ slackClient }, { userId }) => {
    const userProfile = await slackClient.getUserProfile({ userId })

    return {
      firstName: userProfile?.first_name,
      lastName: userProfile?.last_name,
      email: userProfile?.email,
      displayName: userProfile?.display_name,
    }
  }
)
