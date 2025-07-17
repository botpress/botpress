import { wrapAction } from '../action-wrapper'

export const checkInbox = wrapAction(
  { actionName: 'checkInbox', errorMessage: 'Failed to check for new emails' },
  async ({ googleClient }, { query, maxResults, pageToken }) => {
    console.info('Searching for emails with query:', query)
    const result = await googleClient.listMessages(query, maxResults, pageToken)
    console.info('Retrieved messages:', result)

    if (!result || !result.messages) {
      return {
        hasEmails: false,
        messages: [],
        nextPageToken: null,
        resultSizeEstimate: 0,
      }
    }

    const messages = result.messages || []
    const hasEmails = messages.length > 0

    return {
      hasEmails,
      messages: messages.map((msg) => ({
        id: msg.id || '',
        threadId: msg.threadId || '',
      })),
      nextPageToken: result.nextPageToken || null,
      resultSizeEstimate: result.resultSizeEstimate || 0,
    }
  }
)
