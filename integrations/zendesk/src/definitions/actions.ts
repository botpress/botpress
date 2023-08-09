import z from 'zod'

const createTicket = {
  title: 'Create Ticket',
  description: 'Creates a new ticket in Zendesk',
  input: {
    schema: z.object({
      subject: z.string().describe('Subject for the ticket'),
      comment: z.string().describe('Comment for the ticket'),
      requesterName: z.string().describe('Requester name'),
      requesterEmail: z.string().describe('Requester email'),
      __conversationId: z.string().describe('Internal: Conversation ID to bind the ticket to'),
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
    // OUTPUT
    // {
    //   url: 'https://botpress6143.zendesk.com/api/v2/tickets/6.json',
    //   id: 6,
    //   external_id: null,
    //   via: { channel: 'api', source: { from: {}, to: {}, rel: null } },
    //   created_at: '2023-08-09T14:36:46Z',
    //   updated_at: '2023-08-09T14:36:46Z',
    //   type: null,
    //   subject: 'Blahblahblah',
    //   raw_subject: 'Blahblahblah',
    //   description: 'hitl',
    //   priority: null,
    //   status: 'new',
    //   recipient: null,
    //   requester_id: 18364722289165,
    //   submitter_id: 18364722289165,
    //   assignee_id: null,
    //   organization_id: null,
    //   group_id: 18160863843725,
    //   collaborator_ids: [],
    //   follower_ids: [],
    //   email_cc_ids: [],
    //   forum_topic_id: null,
    //   problem_id: null,
    //   has_incidents: false,
    //   is_public: true,
    //   due_at: null,
    //   tags: [],
    //   custom_fields: [],
    //   satisfaction_rating: null,
    //   sharing_agreement_ids: [],
    //   custom_status_id: 18160857554573,
    //   fields: [],
    //   followup_ids: [],
    //   brand_id: 18160857536013,
    //   allow_channelback: false,
    //   allow_attachments: true,
    //   from_messaging_channel: false
    // }
    schema: z.object({
      // TODO: tiddy me up !
      ticket: z.object({
        id: z.number(),
        subject: z.string(),
        description: z.string(),
        status: z.string(),
        // priority: z.string().nullable(),
        requester_id: z.number(),
        assignee_id: z.number().nullable(),
        created_at: z.string(),
        updated_at: z.string(),
        // tags: z.record(z.string()),
      }),
    }),
  },
}
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
}
const closeTicket = {
  title: 'Close ticket',
  description: 'Close a ticket by its id.',
  input: {
    schema: z.object({
      ticketId: z.string().describe('ID of the ticket to close'),
      comment: z.string().optional().describe('Closing comment'),
      authorId: z.string().describe('ID of the zendesk customer'),
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
        id: z.number(),
        subject: z.string(),
        description: z.string(),
        status: z.string(),
        // priority: z.string().nullable(),
        requester_id: z.number(),
        assignee_id: z.number().nullable(),
        created_at: z.string(),
        updated_at: z.string(),
        // tags: z.record(z.string()),
      }),
    }),
  },
}
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
      // TODO: tiddy me up !
      ticket: z.object({
        id: z.number(),
        subject: z.string(),
        description: z.string(),
        status: z.string(),
        // priority: z.string().nullable(),
        requester_id: z.number(),
        assignee_id: z.number().nullable(),
        created_at: z.string(),
        updated_at: z.string(),
        // tags: z.record(z.string()),
      }),
    }),
  },
}
const findCustomer = {
  title: 'Find Customer',
  description: 'Find a Customer in Zendesk',
  input: {
    schema: z.object({
      query: z
        .string()
        .min(2)
        .describe('partial or full value of any user property, including name, email address, notes, or phone.'),
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
}

export const actions = {
  getTicket,
  findCustomer,
  createTicket,
  closeTicket,
  sendMessageToAgent,
}
