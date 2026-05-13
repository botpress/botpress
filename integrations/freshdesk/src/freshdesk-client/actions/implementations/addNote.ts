import { wrapAction } from '../action-wrapper'

export const addNote = wrapAction(
  { actionName: 'addNote', errorMessage: 'Failed to add note to Freshdesk ticket' },
  async ({ freshdeskClient }, input) => {
    const ticketId = parseInt(input.ticketId, 10)
    if (!Number.isFinite(ticketId) || ticketId <= 0) {
      throw new Error(`Invalid ticket ID: "${input.ticketId}". Must be a positive integer.`)
    }
    const note = await freshdeskClient.addNote(ticketId, {
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
