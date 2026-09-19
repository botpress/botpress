import { z } from '@bpinternal/zui'
import { Component } from '../../src/component.js'
import { ListenExit } from '../../src/context.js'
import { Exit } from '../../src/exit.js'
import { TranscriptArray } from '../../src/transcript.js'

// Synthetic fixtures: no captured customer instructions or conversation data.
const message = new Component({
  name: 'Message',
  type: 'default',
  aliases: [],
  description: 'Send a text message or follow-up question.',
  default: { props: z.object({}), children: [] },
})
const leaves = ['Choice', 'Image', 'Audio', 'Video', 'File', 'Carousel', 'Location', 'Dropdown'].map(
  (name) =>
    new Component({
      name,
      type: 'leaf',
      description: `Send a ${name.toLowerCase()} when relevant.`,
      leaf: { props: z.object({ value: z.string() }) },
    })
)

export const protocolScenarios = [
  'Help me choose a plan',
  'Hi',
  'How do I estimate monthly conversations?',
  'Thanks, that helps',
]

export const protocolScenario = (lastMessage: string) => ({
  instructions: `You help visitors choose a plan for the fictional Cedar Desk service. Be brief, friendly, and accurate.
When asked to choose a plan, first ask for expected monthly conversations. Ask one question at a time. Never recommend a plan before knowing that volume. Messages, visits and conversations are different units. Do not invent prices or customer facts.
A greeting deserves a short greeting and an offer to help. Thank-you messages deserve a brief acknowledgement. Explain estimation questions directly, using recent conversation totals rather than message counts.
Use normal assistant text for these conversational replies. Do not send choices, media, or hand off unless the user requests them.

Reference catalogue (context, not a script to recite):
${Array.from({ length: 30 }, (_, i) => `Workspace feature ${i + 1}: Cedar Desk supports configuring a separate workspace preference for team ${i + 1}. It is optional, does not establish the customer's monthly volume, and is not needed to start choosing a plan. Ask about it only if the visitor asks about workspace preferences.`).join('\n')}`,
  transcript: new TranscriptArray([
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: "Hi! I'm the Cedar Desk assistant. How can I help?" },
    {
      role: 'assistant',
      content:
        '{"options":[{"label":"Choose a plan","value":"choose_plan"},{"label":"Explore features","value":"explore"}]}',
    },
    { role: 'user', content: lastMessage },
  ]),
  objects: [],
  globalTools: [],
  components: [message, ...leaves],
  exits: [
    ListenExit,
    new Exit({
      name: 'handoff',
      description: 'Hand off only when requested.',
      schema: z.object({ reason: z.string() }),
    }),
  ],
  iteration: { current: 1, limit: 10, resumed: false, deliveredMessages: [] },
})
