import { wrapAction } from '../action-wrapper'

export const addNote = wrapAction(
  { actionName: 'addNote', errorMessage: 'Failed to add note to Freshdesk ticket' },
  async ({ freshdeskClient }, input) => {
    const note = await freshdeskClient.addNote(input.ticketId, {
      body: input.body,
      private: input.private ?? true,
    })
    return {
      id: note.id,
      body: note.body,
      createdAt: note.created_at,
    }
  }
)
