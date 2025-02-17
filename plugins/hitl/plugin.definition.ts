import * as sdk from '@botpress/sdk'
import hitl from './bp_modules/hitl'

export const DEFAULT_HITL_HANDOFF_MESSAGE =
  'I have escalated this conversation to a human agent. They should be with you shortly.'
export const DEFAULT_HUMAN_AGENT_ASSIGNED_MESSAGE = 'A human agent has joined the conversation.'
export const DEFAULT_HITL_STOPPED_MESSAGE = 'The human agent closed the conversation. I will continue assisting you.'
export const DEFAULT_USER_HITL_CANCELLED_MESSAGE = '( The user has ended the session. )'
export const DEFAULT_INCOMPATIBLE_MSGTYPE_MESSAGE =
  'Sorry, the user can only receive text messages. Please resend your message as a text message.'

export default new sdk.PluginDefinition({
  name: 'hitl',
  version: '0.1.0',
  configuration: {
    schema: sdk.z.object({
      onHitlHandoffMessage: sdk.z
        .string()
        .title('Escalation Started Message')
        .describe('The message to send to the user when transferring to a human agent')
        .optional()
        .placeholder(DEFAULT_HITL_HANDOFF_MESSAGE),
      onHumanAgentAssignedMessage: sdk.z
        .string()
        .title('Human Agent Assigned Message')
        .describe('The message to send to the user when a human agent is assigned')
        .optional()
        .placeholder(DEFAULT_HUMAN_AGENT_ASSIGNED_MESSAGE),
      onHitlStoppedMessage: sdk.z
        .string()
        .title('Escalation Terminated Message')
        .describe('The message to send to the user when the hitl session stops and control is tranfered back to bot')
        .optional()
        .placeholder(DEFAULT_HITL_STOPPED_MESSAGE),
      onUserHitlCancelledMessage: sdk.z
        .string()
        .title('Escalation Aborted Message')
        .describe('The message to send to the human agent when the user abruptly ends the hitl session')
        .optional()
        .placeholder(DEFAULT_USER_HITL_CANCELLED_MESSAGE),
      onIncompatibleMsgTypeMessage: sdk.z
        .string()
        .title('Incompatible Message Type Warning')
        .describe(
          'The warning to send to the human agent when they send a message that is not supported by the hitl session'
        )
        .optional()
        .placeholder(DEFAULT_INCOMPATIBLE_MSGTYPE_MESSAGE),
    }),
  },
  actions: {
    startHitl: {
      title: 'Start HITL',
      description: 'Starts the HITL mode',
      input: {
        schema: sdk.z.object({
          title: sdk.z.string().title('Ticket Title').describe('Title of the HITL ticket'),
          description: sdk.z.string().title('Ticket Description').optional().describe('Description of the HITL ticket'),
          userId: sdk.z.string().title('User ID').describe('ID of the user that starts the HITL mode'),
          userEmail: sdk.z
            .string()
            .title('User Email')
            .optional()
            .describe(
              'Email of the user that starts the HITL mode. If this value is unset, the agent will try to use the email provided by the channel.'
            ),
          conversationId: sdk.z
            .string()
            .title('Conversation ID') // this is the upstream conversation
            .describe('ID of the conversation on which to start the HITL mode'),
        }),
      },
      output: { schema: sdk.z.object({}) },
    },
    stopHitl: {
      title: 'Stop HITL',
      description: 'Stop the HITL mode',
      input: {
        schema: sdk.z.object({
          conversationId: sdk.z.string().describe('ID of the conversation on which to stop the HITL mode'),
        }),
      },
      output: { schema: sdk.z.object({}) },
    },
  },
  states: {
    hitl: {
      type: 'conversation',
      schema: sdk.z.object({
        hitlActive: sdk.z.boolean().title('Is HITL Enabled?').describe('Whether the bot is in HITL mode'),
      }),
    },
  },
  user: {
    tags: {
      downstream: {
        title: 'Downstream User ID',
        description: 'ID of the downstream user binded to the upstream one',
      },
      upstream: {
        title: 'Upstream User ID',
        description: 'ID of the upstream user binded to the downstream one',
      },
    },
  },
  conversation: {
    tags: {
      downstream: {
        title: 'Downstream Conversation ID',
        description: 'ID of the downstream conversation binded to the upstream one',
      },
      upstream: {
        title: 'Upstream Conversation ID',
        description: 'ID of the upstream conversation binded to the downstream one',
      },
      humanAgentId: {
        title: 'Human Agent ID',
        description: 'ID of the human agent assigned to the ticket',
      },
      humanAgentName: {
        title: 'Human Agent Name',
        description: 'Name of the human agent assigned to the ticket',
      },
    },
  },
  interfaces: {
    hitl,
  },
})
