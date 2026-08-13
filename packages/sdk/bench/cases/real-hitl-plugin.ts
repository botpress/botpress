import * as types from '../types.js'

export default {
  name: 'real-hitl-plugin',
  instantiationThreshold: 40000,
  sourceCode: `
// Adapted from plugins/hitl/plugin.definition.ts — a real, schema-heavy plugin.
// The dependency on the 'hitl' interface package (bp_modules/hitl) was removed
// to keep this fixture self-contained.
import { z, PluginDefinition } from '@botpress/sdk'

const PLUGIN_CONFIG_SCHEMA = z.object({
  onHitlHandoffMessage: z
    .string()
    .title('Escalation Started Message')
    .describe('The message sent to the user when a handoff to a human agent starts')
    .optional(),
  agentAssignedTimeoutSeconds: z.number().title('Agent Assigned Timeout').nonnegative().optional(),
  useHumanAgentInfo: z.boolean().default(true).title('Use Human Agent Info').describe('Whether to use human agent info'),
})

export default new PluginDefinition({
  name: 'hitl',
  version: '1.4.2',
  title: 'Human In The Loop',
  description: 'Seamlessly transfer conversations to human agents',
  configuration: { schema: PLUGIN_CONFIG_SCHEMA },
  actions: {
    startHitl: {
      title: 'Start HITL',
      input: {
        schema: z
          .object({
            title: z.string().title('Ticket Title'),
            hitlSession: z.object({ id: z.string() }).optional().title('Extra configuration'),
            configurationOverrides: PLUGIN_CONFIG_SCHEMA.partial().optional(),
          })
          .passthrough(),
      },
      output: { schema: z.object({}) },
    },
    stopHitl: {
      title: 'Stop HITL',
      input: { schema: z.object({ conversationId: z.string() }) },
      output: { schema: z.object({}) },
    },
  },
  states: {
    hitl: { type: 'conversation', schema: z.object({ hitlActive: z.boolean() }) },
    effectiveSessionConfig: { type: 'conversation', schema: PLUGIN_CONFIG_SCHEMA },
  },
  user: {
    tags: {
      downstream: { title: 'Downstream User ID', description: 'The downstream user id' },
      upstream: { title: 'Upstream User ID', description: 'The upstream user id' },
    },
  },
  conversation: {
    tags: {
      downstream: { title: 'Downstream Conversation ID', description: 'The downstream conversation id' },
      humanAgentId: { title: 'Human Agent ID', description: 'The human agent id' },
    },
  },
  message: {
    tags: {
      downstream: { title: 'Downstream Message ID', description: 'The downstream message id' },
    },
  },
  events: {
    humanAgentAssignedTimeout: {
      schema: z.object({ sessionStartedAt: z.string(), downstreamConversationId: z.string() }),
    },
    continueWorkflow: { schema: z.object({ conversationId: z.string() }) },
  },
})
`,
} satisfies types.BenchmarkCase
