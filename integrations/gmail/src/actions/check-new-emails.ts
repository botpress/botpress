import { wrapAction } from '../action-wrapper'

export const checkNewEmails = wrapAction(
  { actionName: 'checkNewEmails', errorMessage: 'Failed to check for new emails' },
  async ({ googleClient }, { query, maxResults, pageToken }) => {
    const result = await googleClient.listMessages(query, maxResults, pageToken)
    console.info('Retrieved messages:', result)

    if (!result || !result.messages) {
      return {
        hasNewEmails: false,
        messages: [],
        nextPageToken: null,
        resultSizeEstimate: 0,
      }
    }

    const messages = result.messages || []
    const hasNewEmails = messages.length > 0

    return {
      hasNewEmails,
      messages: messages.map((msg) => ({
        id: msg.id || '',
        threadId: msg.threadId || '',
      })),
      nextPageToken: result.nextPageToken || null,
      resultSizeEstimate: result.resultSizeEstimate || 0,
    }
  }
)
