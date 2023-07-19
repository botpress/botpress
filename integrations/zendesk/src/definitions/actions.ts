import z from 'zod';

const createTicket = {
  title: 'Get ticket',
  description: 'Get Ticket by id.',
  input: {
    schema: z.object({
      subject: z.string().describe('Subject for the ticket'),
      comment: z.string().describe('Comment for the ticket'),
      requesterName: z.string().describe('Requester name'),
      requesterEmail: z.string().describe('Requester email'),
    }),
    ui: {
      subject: {
        title: 'Ticket subject',
      },
      comment: {
        title: 'Ticket comment',
      },
      requesterName: {
        title: 'Requester name',
      },
      requesterEmail: {
        title: 'Requester email',
      },
    },
  },
  output: {
    schema: z.object({
      ticket: z.object({
        id: z.string(),
        subject: z.string(),
        description: z.string(),
        status: z.string(),
        priority: z.string(),
        requesterId: z.number(),
        assigneeId: z.number(),
        createdAt: z.string(),
        updatedAt: z.string(),
        tags: z.record(z.string()),
      }),
    }),
  },
};
const getTicket = {
  title: 'Get ticket',
  description: 'Get Ticket by id.',
  input: {
    schema: z.object({
      ticketId: z.string().describe('The ID of the ticket'),
    }),
    ui: {
      ticketId: {
        title: 'Ticket id',
      },
    },
  },
  output: {
    schema: z.object({
      ticket: z.object({
        id: z.string(),
        subject: z.string(),
        description: z.string(),
        status: z.string(),
        priority: z.string(),
        requesterId: z.number(),
        assigneeId: z.nullable(z.number()),
        createdAt: z.string(),
        updatedAt: z.string(),
        tags: z.record(z.string()),
      }),
    }),
  },
};
const closeTicket = {
  title: 'Close ticket',
  description: 'Close a ticket by its id.',
  input: {
    schema: z.object({
      ticketId: z.string().describe('ID of the ticket to close'),
      comment: z.string().optional().describe('Closing comment'),
    }),
    ui: {
      ticketId: {
        title: 'Ticket ID',
      },
      comment: {
        title: 'Closing comment',
      },
    },
  },
  output: {
    schema: z.object({
      ticket: z.object({
        id: z.string(),
        subject: z.string(),
        description: z.string(),
        status: z.string(),
        priority: z.string(),
        requesterId: z.number(),
        assigneeId: z.number(),
        createdAt: z.string(),
        updatedAt: z.string(),
        tags: z.record(z.string()),
      }),
    }),
  },
};
const sendMessageToAgent = {
  title: 'Send message to agent',
  description: 'Sends a message to the zendesk agent.',
  input: {
    schema: z.object({
      ticketId: z.string().describe('ID of the ticket to close'),
      authorId: z.string().describe('ID of the zendesk customer'),
      comment: z.string().describe('comment'),
    }),
    ui: {
      ticketId: {
        title: 'Ticket ID',
      },
      authorId: {
        title: 'Author ID',
      },
      comment: {
        title: 'Comment',
      },
    },
  },
  output: {
    schema: z.object({
      ticket: z.object({
        id: z.string(),
        subject: z.string(),
        description: z.string(),
        status: z.string(),
        priority: z.string(),
        requesterId: z.number(),
        assigneeId: z.number(),
        createdAt: z.string(),
        updatedAt: z.string(),
        tags: z.record(z.string()),
      }),
    }),
  },
};
const findCustomer = {
  title: 'Find Customer',
  description: 'Find a Customer in Zendesk',
  input: {
    schema: z.object({
      query: z
        .string()
        .min(2)
        .describe(
          'partial or full value of any user property, including name, email address, notes, or phone.'
        ),
    }),
    ui: {
      query: {
        title: 'Search Query',
      },
    },
  },
  output: {
    schema: z.object({
      customers: z.array(
        z.object({
          name: z.string(),
          email: z.string(),
          phone: z.string(),
          tags: z.record(z.string()),
        })
      ),
    }),
  },
};

export const actions = {
  getTicket,
  findCustomer,
  createTicket,
  closeTicket,
  sendMessageToAgent,
};
