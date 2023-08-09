import z from 'zod'

const ticketAssigned = {
  title: 'The ticket has been assigned to an Agent',
  description: 'Triggered when the assigneeId has changed from null',
  schema: z.object({
    type: z.string(),
    agent: z.string(),
    comment: z.string(),
    ticketId: z.string(),
  }),
  ui: {},
}

const ticketSolved = {
  title: 'The ticket has been solved',
  description: 'Triggered when the status of the ticket is changed to SOLVED',
  schema: z.object({
    type: z.string(),
    agent: z.string(),
    comment: z.string(),
    ticketId: z.string(),
  }),
  ui: {},
}

export const events = {
  ticketSolved,
  ticketAssigned,
}
