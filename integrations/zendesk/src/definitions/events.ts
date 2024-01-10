import z from 'zod'

const ticketAssigned = {
  title: 'Ticket:Assigned',
  description: 'Triggered when the assigneeId has changed from null',
  schema: z.object({
    type: z.string(),
    comment: z.string(),
    ticketId: z.string(),
    status: z.string(),
    agent: z.object({
      name: z.string(),
      email: z.string(),
    }),
  }),
  ui: {},
}

const ticketSolved = {
  title: 'Ticket:Solved',
  description: 'Triggered when the status of the ticket is changed to SOLVED',
  schema: z.object({
    type: z.string(),
    comment: z.string(),
    ticketId: z.string(),
    status: z.string(),
  }),
  ui: {},
}

export const events = {
  ticketSolved,
  ticketAssigned,
}
