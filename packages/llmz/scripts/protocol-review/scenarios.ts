import { z } from '@bpinternal/zui'
import assert from 'node:assert/strict'

import { DefaultComponents } from '../../src/chat/component.default.js'
import { ListenExit } from '../../src/context.js'
import { LoopExceededError, ThinkSignal } from '../../src/errors.js'
import { truncate } from '../../src/index.js'
import { Session } from '../../src/session/session.js'
import type { Transcript } from '../../src/session/transcript.js'
import { Tool } from '../../src/tool.js'
import { getTokenizer } from '../../src/utils.js'
import { codeReply, PromptReview, textReply, type ReviewExecution, type ReviewScenario } from './capture.js'
import { cancelled, createFixtures, handoff, media, resolved } from './fixtures.js'

export const scenarios = [
  multiTurnMemory,
  thinking,
  recovery,
  buttons,
  mediaGallery,
  voice,
  typedExits,
  compaction,
  typedWorker,
  workerWithoutExits,
  executionReport,
  retrievedMarkdown,
  toolResultBudgets,
  plainTextResponse,
  customResponse,
  queuedSessionInput,
]

function createReview(name: string, title: string, description: string) {
  const { calls, ...settings } = createFixtures()

  return { review: new PromptReview({ name, title, description }, settings), calls, settings }
}

function executions(scenario: ReviewScenario): ReviewExecution[] {
  return scenario.steps.filter((step): step is ReviewExecution => step.type === 'execution')
}

async function multiTurnMemory() {
  const { review, calls } = createReview(
    '01-multi-turn-memory',
    'Multi-turn chat, inspections, and memory',
    'Read two tools in one JavaScript call, inspect twice, then answer. A later user turn reuses named memory and changes a schema-bearing object property. Every prompt includes three business tools, three typed exits plus listen, and the full default component catalog.'
  )

  await review.run(
    'Turn 1: parallel lookups, two inspections, then text',
    [
      codeReply(`const [account, invoice] = await Promise.all([
  readAccount({ customerId: customer.id }),
  readInvoice({ customerId: customer.id }),
]);

return inspect({ account, invoice });`),
      codeReply(`const accountName = $return.account.name;

return inspect({
  accountName,
  total: $iterations[0].result.invoice.total,
});`),
      textReply('Maya, your latest invoice is $20 USD and has been paid.'),
    ],
    {
      messages: [{ role: 'user', content: 'Can you check my account and latest invoice?' }],
      streaming: true,
    }
  )

  await review.run(
    'Turn 2: update object memory without repeating the lookups',
    [
      codeReply(`customer.preferences = { ...customer.preferences, emailUpdates: false };

return inspect({
  name: accountName,
  preferences: customer.preferences,
  previousTotal: $iterations[1].result.total,
});`),
      textReply('Email updates are now disabled, Maya.'),
    ],
    {
      messages: [{ role: 'user', content: 'Thanks. Please turn off email updates.' }],
      streaming: true,
    }
  )

  assert.deepEqual(calls, { readAccount: 1, readInvoice: 1, getMedia: 0 })
  assert.deepEqual(review.session.memory.getObjectPropertyValue('customer', 'preferences'), {
    plan: 'Standard',
    emailUpdates: false,
  })
  assert.ok(review.deltas.some((delta) => !delta.restart && delta.delta))
  review.note(
    'Verified: each lookup ran once. The second turn reused memory and replaced the writable preferences value.'
  )

  return review.scenario
}

async function thinking() {
  const { review, settings } = createReview(
    '02-thinking',
    'Thinking interruption and retained variables',
    'A host tool raises ThinkSignal with a reason and context. This requests another model response; it is not hidden model reasoning. Statements after the interruption do not run.'
  )
  let laterCalls = 0
  const tools = [
    ...settings.tools,
    new Tool({
      name: 'checkUpgrade',
      description: 'Check whether an upgrade is available. May ask the model to reconsider if approval is needed.',
      handler: async () => {
        throw new ThinkSignal('This upgrade needs billing approval. Ask whether the user wants a billing handoff.', {
          requestedPlan: 'Team',
          approvalRequired: true,
        })
      },
    }),
    new Tool({
      name: 'applyUpgrade',
      description: 'Apply an upgrade after all required approval is complete.',
      handler: async () => {
        laterCalls++

        return { upgraded: true }
      },
    }),
  ]

  const result = await review.run(
    'Turn 1: interrupt, then offer choices',
    [
      codeReply(`const requestedPlan = 'Team';
await checkUpgrade();
const upgrade = await applyUpgrade();

return inspect(upgrade);`),
      codeReply(
        `chat.buttons([
  { label: 'Talk to billing' },
  { label: 'Keep my current plan' },
]);

return exit('listen');`,
        'This upgrade needs billing approval. Would you like to talk to billing?'
      ),
    ],
    {
      tools,
      messages: [{ role: 'user', content: 'Please upgrade me to Team if no approval is needed.' }],
    }
  )

  assert.equal(result.iterations[0]?.status.type, 'thinking_requested')
  assert.equal(laterCalls, 0)
  assert.equal(review.session.memory.variables.requestedPlan, 'Team')
  review.note('Verified: applyUpgrade did not run; requestedPlan survived the interruption.')

  return review.scenario
}

async function recovery() {
  const { review, settings } = createReview(
    '03-error-recovery',
    'Recovery after partial success',
    'Creating a support request succeeds, then receipt generation fails. The next request shows the actual error and retained request ID. Recovery retries only receipt generation.'
  )
  let created = 0
  let receipts = 0
  const tools = [
    ...settings.tools,
    new Tool({
      name: 'createSupportRequest',
      description: 'Create a support request once. Do not repeat a successful creation.',
      input: z.object({ subject: z.string() }),
      output: z.object({ id: z.string() }),
      handler: async () => {
        created++

        return { id: 'request-42' }
      },
    }),
    new Tool({
      name: 'generateReceipt',
      description: 'Get a receipt for an existing support request; transient failures may be retried.',
      input: z.object({ requestId: z.string() }),
      output: z.object({ reference: z.string() }),
      handler: async () => {
        receipts++

        if (receipts === 1) {
          throw new Error('Receipt service temporarily unavailable. Retry for the existing request.')
        }

        return { reference: 'receipt-42' }
      },
    }),
  ]

  const result = await review.run(
    'Turn 1: partial success, retry, then answer',
    [
      codeReply(`const request = await createSupportRequest({ subject: 'Invoice question' });
const receipt = await generateReceipt({ requestId: request.id });

return inspect({ request, receipt });`),
      codeReply(`const receipt = await generateReceipt({ requestId: request.id });

return inspect({ request, receipt });`),
      textReply('Support request request-42 is ready. Your receipt reference is receipt-42.'),
    ],
    {
      tools,
      messages: [{ role: 'user', content: 'Open a support request about my invoice and give me the receipt.' }],
    }
  )

  assert.equal(result.iterations[0]?.status.type, 'execution_error')
  assert.equal(created, 1)
  assert.equal(receipts, 2)
  review.note(
    'Verified local call counts: createSupportRequest = 1; generateReceipt = 2. Completed work was not repeated.'
  )

  return review.scenario
}

async function buttons() {
  const { review } = createReview(
    '04-buttons-and-listen',
    'Streamed text, buttons, and listen in one response',
    'Ordinary assistant text and a single JavaScript call send two buttons and explicitly select listen. The next request occurs only when another user turn begins.'
  )

  const result = await review.run(
    'Turn 1: text plus buttons',
    [
      codeReply(
        `chat.buttons([
  { action: 'say', label: 'Standard' },
  { action: 'say', label: 'Team' },
]);

return exit('listen');`,
        'Which plan would you like?'
      ),
    ],
    {
      messages: [{ role: 'user', content: 'Show me the plan choices.' }],
      streaming: true,
    }
  )

  assert.ok(result.is(ListenExit))
  assert.equal(executions(review.scenario)[0]?.requests.length, 1)

  await review.run('Turn 2: the user chooses a button', [textReply('You selected Team.')], {
    messages: [{ role: 'user', content: 'Team' }],
    streaming: true,
  })

  const delivered = executions(review.scenario)[0]!.delivered

  // Stream previews precede the buttons; final text delivery can follow synchronous component calls.
  assert.equal(delivered.filter((message) => message.type === 'text').length, 1)
  assert.deepEqual(
    delivered.filter((message) => message.type === 'component').map((message) => message.name),
    ['buttons']
  )

  return review.scenario
}

async function mediaGallery() {
  const { review, calls } = createReview(
    '05-images-audio-and-components',
    'User image and voice; assistant media and every default component',
    'A user sends an image and a voice attachment through Session.append. One JavaScript program obtains outgoing media URLs and sends all seven rich components through synchronous methods; normal assistant prose is delivered as text. The next user turn reveals the exact retained multimedia and component history. Media URLs are inert transport fixtures; no image decoding, STT, playback, or TTS occurs.'
  )
  const messages: Transcript.Message[] = [
    {
      role: 'user',
      content:
        'Here is my invoice screenshot and a voice question. Show me the plan information in all supported formats.',
      attachments: [
        { type: 'image', url: media.userImage, id: 'invoice-screen', alt: 'Invoice screenshot' },
        { type: 'audio', url: media.userVoice, id: 'plan-question', alt: 'Spoken plan question' },
      ],
    },
  ]

  await review.run(
    'Turn 1: incoming image/audio and outgoing component gallery',
    [
      codeReply(
        `const assets = await getMedia();

chat.image({ url: assets.image, alt: 'Plan comparison' });
chat.audio({ url: assets.audio, title: 'Spoken overview' });
chat.video({ url: assets.video, title: 'Getting started' });
chat.file({ url: assets.file, name: 'Plans.pdf' });
chat.card({ title: 'Standard', subtitle: '$20/month', text: 'For individual projects.' });
chat.carousel({
  cards: [
    {
      title: 'Standard',
      subtitle: '$20/month',
      image: { url: assets.image, alt: 'Plan comparison' },
      buttons: [{ action: 'postback', label: 'Choose Standard', value: 'plan_standard' }],
    },
    {
      title: 'Team',
      subtitle: '$50/month',
      buttons: [{ action: 'postback', label: 'Choose Team', value: 'plan_team' }],
    },
  ],
});
chat.buttons([{ action: 'url', label: 'Open guide', url: assets.file }]);

return exit('listen');`,
        'Here are the plan details in the requested formats.'
      ),
    ],
    { messages, streaming: true }
  )

  await review.run(
    'Turn 2: inspect retained media and rich-message history',
    [textReply('Team costs $50 per month.')],
    {
      messages: [{ role: 'user', content: 'What was the Team price in the carousel?' }],
    }
  )

  assert.equal(calls.getMedia, 1)
  const runs = executions(review.scenario)

  for (const request of runs.flatMap((run) => run.requests)) {
    const parts = request.messages.flatMap((message) => (Array.isArray(message.content) ? message.content : []))
    const attachments = parts.filter((part) => part.type === 'image' || part.type === 'audio')

    assert.deepEqual(attachments, [
      { type: 'image', url: media.userImage },
      { type: 'audio', url: media.userVoice },
    ])
  }

  assert.equal(runs[0]?.delivered.filter((message) => message.type === 'text').length, 1)
  assert.deepEqual(
    runs[0]?.delivered.filter((message) => message.type === 'component').map((message) => message.name),
    ['image', 'audio', 'video', 'file', 'card', 'carousel', 'buttons']
  )
  review.note(
    'Verified: incoming image/audio URLs are preserved in both requests. All seven rich default components were delivered alongside assistant text. Audio is an existing clip.'
  )

  return review.scenario
}

async function voice() {
  const { calls: _calls, ...settings } = createFixtures()
  const review = new PromptReview(
    {
      name: '06-voice-conversation',
      title: 'Voice conversation and upstream-transcribed user speech',
      description:
        'Configure the speech response preset alongside rich components, so ordinary streamed assistant prose is written for speech playback. First show a raw user audio attachment; then start an independent conversation with already-transcribed speech. The client captures transport only and performs no transcription or synthesis.',
    },
    {
      ...settings,
      response: 'speech',
    }
  )

  await review.run(
    'Raw voice input: audio remains a multipart content part',
    [textReply('The team plan costs fifty dollars a month.')],
    {
      messages: [
        {
          role: 'user',
          content: '',
          attachments: [
            { type: 'audio', url: media.userVoice, id: 'voice-question', alt: 'Question about plan pricing' },
          ],
        },
      ],
      streaming: true,
    }
  )

  review.session = new Session()
  review.note('Host starts a separate conversation to show upstream-transcribed speech without retained raw audio.')

  await review.run(
    'Upstream transcript: voice modality without an audio attachment',
    [textReply('The standard plan costs twenty dollars a month.')],
    {
      messages: [{ role: 'user', content: 'How much is the standard plan?', modality: 'voice' }],
      streaming: true,
    }
  )

  for (const run of executions(review.scenario)) {
    assert.deepEqual(
      run.delivered.map((message) => message.type),
      ['text']
    )
  }

  assert.ok(review.deltas.some((delta) => !delta.restart && delta.delta))
  review.note(
    'Stream previews are captured verbatim below each execution. Both speech-oriented final replies and their stream chunks use the native text message shape.'
  )

  return review.scenario
}

async function typedExits() {
  const { review } = createReview(
    '07-typed-exits',
    'Typed completion, handoff, and cancellation',
    'Three independent conversations exercise all configured typed exits. Completion derives its payload from a real local tool result; handoff pairs a component with its typed exit; cancellation stops silently. These are local exit receipts, not real support transfers.'
  )

  const complete = await review.run(
    'Complete directly from a tool result',
    [
      codeReply(`const invoice = await readInvoice({ customerId: customer.id });

return exit('resolved', { summary: 'Invoice ' + invoice.id + ' is ' + invoice.status });`),
    ],
    { messages: [{ role: 'user', content: 'Check the invoice and complete the task with its status.' }] }
  )

  assert.ok(complete.is(resolved))
  assert.deepEqual(complete.output, { summary: 'Invoice invoice-42 is paid' })
  review.session = new Session()
  review.note('Host starts an independent conversation for the handoff case.')

  const transferred = await review.run(
    'Present a handoff card and select a typed exit in one call',
    [
      codeReply(`chat.card({ title: 'Billing support', text: 'Your invoice question is ready for billing.' });

return exit('handoff', { queue: 'billing', reason: 'User requested billing support' });`),
    ],
    { messages: [{ role: 'user', content: 'Please transfer me to billing.' }] }
  )

  assert.ok(transferred.is(handoff))
  assert.deepEqual(transferred.output, { queue: 'billing', reason: 'User requested billing support' })
  review.session = new Session()
  review.note('Host starts an independent conversation for the cancellation case.')

  const stopped = await review.run(
    'Cancel without beginning business work',
    [codeReply(`return exit('cancelled', { reason: 'User cancelled the request' });`)],
    { messages: [{ role: 'user', content: 'Cancel this request.' }] }
  )

  assert.ok(stopped.is(cancelled))
  assert.deepEqual(stopped.output, { reason: 'User cancelled the request' })

  return review.scenario
}

async function compaction() {
  const { review } = createReview(
    '09-compaction',
    'Compaction preserves named variables',
    'Explicitly remove all settled iterations between user turns. The next request retains the named preference but drops old automatic $return/$iterations data. This exercises the host compaction API, not an automatic context-overflow trigger.'
  )

  await review.run(
    'Turn 1: save a named preference and inspect it',
    [
      codeReply(`const preferredPlan = 'Team';

return inspect({ preferredPlan });`),
      textReply('I will remember that you prefer Team.'),
    ],
    { messages: [{ role: 'user', content: 'Remember that I prefer Team.' }] }
  )

  review.session.prune([])
  assert.deepEqual(review.session.memory.variables, { preferredPlan: 'Team' })
  assert.equal(review.session.iterations.length, 0)
  assert.equal(review.session.getBindings().$return, undefined)
  review.note('Host calls session.prune([]). The argument contains IDs to keep, so all settled iterations are removed.')

  await review.run(
    'Turn 2: inspect what survived compaction',
    [
      codeReply(`return inspect({
  preferredPlan,
  historyLength: $iterations.length,
  hasPreviousReturn: $return !== undefined,
});`),
      textReply('Your preferred plan is Team.'),
    ],
    { messages: [{ role: 'user', content: 'What is my preferred plan?' }] }
  )

  assert.deepEqual(review.session.getBindings().$return, {
    preferredPlan: 'Team',
    historyLength: 0,
    hasPreviousReturn: false,
  })

  return review.scenario
}

async function typedWorker() {
  const { calls, ...settings } = createFixtures()
  const review = new PromptReview(
    {
      name: '10-worker-typed-exit',
      title: 'Worker inspection and typed completion without chat',
      description:
        'A worker reads local account and invoice fixtures, inspects the result, then completes through its registered resolved exit. No Chat is configured: neither component methods nor chat instructions belong in either captured system prompt.',
    },
    {
      ...settings,
      mode: 'worker',
      exits: [resolved],
      instructions: 'Read the account and latest invoice, then complete with a concise verified summary.',
    }
  )

  const result = await review.run(
    'Inspect the business results, then select the typed completion',
    [
      codeReply(`const [account, invoice] = await Promise.all([
  readAccount({ customerId: customer.id }),
  readInvoice({ customerId: customer.id }),
]);

return inspect({ account, invoice });`),
      codeReply(`return exit('resolved', {
  summary: $return.account.name + ': invoice ' + $return.invoice.id + ' is ' + $return.invoice.status,
});`),
    ],
    { messages: [{ role: 'user', content: 'Summarize the current invoice for this customer.' }] }
  )

  assert.ok(result.is(resolved))
  assert.deepEqual(result.output, { summary: 'Maya: invoice invoice-42 is paid' })
  assert.deepEqual(calls, { readAccount: 1, readInvoice: 1, getMedia: 0 })
  const [run] = executions(review.scenario)
  assert.equal(run!.requests.length, 2)
  assert.deepEqual(run!.delivered, [])
  assert.deepEqual(run!.deltas, [])

  for (const request of run!.requests) {
    const prompt = request.messages
      .filter((message) => message.role === 'system')
      .map((message) => String(message.content))
      .join('\n')

    assert.doesNotMatch(prompt, /\bchat\b/i)
    assert.match(prompt, /declare function exit\(name: "resolved"/)
    assert.doesNotMatch(prompt, /exit\(["']listen["']/)
  }

  review.note('Verified: no chat API is documented or delivered. The typed exit returns the observed invoice summary.')

  return review.scenario
}

async function workerWithoutExits() {
  const { calls, ...settings } = createFixtures()
  const review = new PromptReview(
    {
      name: '11-worker-no-exits',
      title: 'Worker inspection with no available completion exit',
      description:
        'A worker explicitly configures exits: [] and no Chat. Its single allowed model response reads the invoice and returns inspect(invoice). The inspection succeeds and remains in memory, but the bounded invocation ends with LoopExceededError because no completion exit exists. This is an inspection capture, not a successful worker completion.',
    },
    {
      ...settings,
      mode: 'worker',
      exits: [],
      instructions: 'Read the latest invoice and return it for inspection. No task completion exit is configured.',
    }
  )

  const result = await review.run(
    'Capture one inspection and the actual exhausted response budget',
    [
      codeReply(`const invoice = await readInvoice({ customerId: customer.id });

return inspect(invoice);`),
    ],
    {
      messages: [{ role: 'user', content: 'Inspect the latest invoice.' }],
      options: { loop: 1 },
      expectedStatus: 'error',
    }
  )

  assert.ok(result.isError())
  assert.ok(result.error instanceof LoopExceededError)
  assert.deepEqual(result.iterations[0]?.exits, [])
  assert.equal(result.iterations[0]?.status.type, 'thinking_requested')
  assert.deepEqual(result.session.getBindings().$return, {
    id: 'invoice-42',
    total: 20,
    currency: 'USD',
    status: 'paid',
  })
  assert.deepEqual(calls, { readAccount: 0, readInvoice: 1, getMedia: 0 })
  const [run] = executions(review.scenario)
  assert.equal(run!.requests.length, 1)
  assert.deepEqual(run!.delivered, [])
  assert.deepEqual(run!.deltas, [])
  const prompt = run!.requests[0]!.messages.filter((message) => message.role === 'system')
    .map((message) => String(message.content))
    .join('\n')

  assert.doesNotMatch(prompt, /\bchat\b/i)
  assert.doesNotMatch(prompt, /\bexit\s*\(/)
  assert.match(prompt, /declare function inspect/)
  review.note(
    'Verified: the prompt documents inspection but no chat methods or exit function. The invoice was read once and retained; the host outcome is a bounded-loop error, not completion.'
  )

  return review.scenario
}

async function executionReport() {
  const { review, calls } = createReview(
    '12-execution-report',
    'A complete execution report: tools, message, memory, and inspection',
    'One JavaScript program reads the account and invoice, changes a writable preference, retains a summary, sends a card, and returns an inspection result. The next captured request shows the actual report of successful business calls, delivered content, created and updated memory, and the inspected value before a separate named completion.'
  )

  const result = await review.run(
    'Read, update, send, and inspect; then complete from the reported evidence',
    [
      codeReply(`const account = await readAccount({ customerId: customer.id });
const invoice = await readInvoice({ customerId: customer.id });
customer.preferences = { ...customer.preferences, emailUpdates: false };
const summary = account.name + ': invoice ' + invoice.id + ' is ' + invoice.status;

chat.card({
  title: 'Invoice ' + invoice.id,
  subtitle: invoice.currency + ' ' + invoice.total,
  text: 'The invoice is ' + invoice.status + '. Email updates are now disabled.',
});

return inspect({ summary, emailUpdates: customer.preferences.emailUpdates });`),
      codeReply(`return exit('resolved', { summary: $return.summary });`),
    ],
    {
      messages: [
        {
          role: 'user',
          content: 'Check my latest invoice, disable email updates, and send an invoice card before completing.',
        },
      ],
    }
  )

  assert.ok(result.is(resolved))
  assert.deepEqual(result.output, { summary: 'Maya: invoice invoice-42 is paid' })
  assert.deepEqual(calls, { readAccount: 1, readInvoice: 1, getMedia: 0 })
  assert.deepEqual(review.session.memory.getObjectPropertyValue('customer', 'preferences'), {
    plan: 'Standard',
    emailUpdates: false,
  })
  assert.equal(review.session.memory.variables.summary, 'Maya: invoice invoice-42 is paid')
  const [run] = executions(review.scenario)
  assert.equal(run!.requests.length, 2)
  assert.equal(run!.delivered.length, 1)
  assert.deepEqual(run!.delivered[0], {
    type: 'component',
    name: 'card',
    props: {
      title: 'Invoice invoice-42',
      subtitle: 'USD 20',
      text: 'The invoice is paid. Email updates are now disabled.',
    },
  })
  const report = run!.requests[1]!.messages.find((message) => message.type === 'tool_result')
  const content = String(report?.content)

  assert.match(content, /^run_javascript: succeeded/)
  assert.ok(content.includes('Tools called'))
  assert.ok(content.includes('Messages sent'))
  assert.ok(content.includes('Memory changes'))
  assert.ok(content.includes('inspect() result'))
  review.note(
    'Verified: two business calls, one card, retained summary, changed customer.preferences, and an inspection result all appear in the same execution report. The following response completes with the observed summary.'
  )

  return review.scenario
}

async function retrievedMarkdown() {
  const { review, settings } = createReview(
    '13-retrieved-markdown',
    'Readable retrieved text and bounded large inspections',
    'An offline search fixture returns Markdown evidence with paragraphs, bullets, a table, source references, and a code block. Scripted replies use that evidence and explicitly exit to listen. A second search returns a much larger document to verify token-bounded inspection without truncating the stored value. No search service or model provider is contacted.'
  )
  const evidence = [
    '# Refund eligibility',
    '',
    'Retrieved from the billing guide and account settings reference. [1] [2]',
    '',
    'A Standard subscription can be refunded within 14 days of its first payment, provided no earlier refund was granted. Renewal payments are reviewed by billing support. [1]',
    '',
    '## Before contacting support',
    '',
    '- Keep the invoice number and the account email available.',
    '- Turning off email updates does not cancel a subscription. [2]',
    '',
    '| Payment | Next step |',
    '| --- | --- |',
    '| First payment, within 14 days | Request a refund review |',
    '| Renewal payment | Contact billing support |',
    '',
    '## Settings example',
    '',
    '```json',
    '{',
    '  "emailUpdates": false,',
    '  "subscriptionStatus": "active"',
    '}',
    '```',
    '',
    '## Sources',
    '',
    '[1]: https://example.invalid/help/refunds "Billing guide, refund eligibility"',
    '[2]: https://example.invalid/help/email-settings "Account settings reference"',
  ].join('\n')
  const largeEvidence = [
    evidence,
    ...Array.from(
      { length: 80 },
      (_, index) =>
        `## Supporting extract ${index + 1}\n\nInvoice review requires the account email, invoice number, and payment date. The 14-day first-payment rule does not guarantee approval; billing support checks eligibility before issuing a refund. Keep the current subscription active until cancellation is separately confirmed. [1]\n\nSource: https://example.invalid/help/refunds#review-${index + 1}`
    ),
    'END_OF_COMPLETE_RETRIEVED_DOCUMENT',
  ].join('\n\n')
  let searches = 0
  const tools = [
    ...settings.tools,
    new Tool({
      name: 'searchHelp',
      description: 'Search help articles and return the matching Markdown excerpts with source references.',
      input: z.object({ query: z.string(), detail: z.enum(['summary', 'full']) }),
      output: z.string(),
      handler: async ({ detail }) => {
        searches++

        return detail === 'full' ? largeEvidence : evidence
      },
    }),
  ]

  const first = await review.run(
    'Turn 1: inspect formatted search evidence before answering',
    [
      codeReply(`const evidence = await searchHelp({ query: 'refund eligibility and email settings', detail: 'summary' });

return inspect(evidence);`),
      codeReply(
        `return exit('listen');`,
        'The guide allows a refund review within 14 days of the first payment; renewals go to billing support. Turning off email updates does not cancel your subscription. [Refund guide](https://example.invalid/help/refunds) · [Email settings](https://example.invalid/help/email-settings)'
      ),
    ],
    {
      tools,
      messages: [
        { role: 'user', content: 'What is the refund policy, and will disabling email updates cancel my plan?' },
      ],
      streaming: true,
    }
  )

  assert.ok(first.is(ListenExit))
  assert.equal(review.session.memory.variables.evidence, evidence)
  const firstRun = executions(review.scenario)[0]!
  assert.equal(firstRun.requests.length, 2)
  const firstReport = firstRun.requests[1]!.messages.filter((message) => message.type === 'tool_result').at(-1)
  const firstContent = String(firstReport?.content)
  const [report, memory] = firstContent.split('\n\n<runtime-memory>\n')

  assert.ok(report!.includes(evidence), 'The inspection must preserve the retrieved Markdown and actual line breaks.')
  assert.equal(firstContent.split(evidence).length, 2, 'The full retrieved document should appear exactly once.')
  assert.ok(report!.includes('\n| Payment | Next step |\n'))
  assert.ok(report!.includes('\n```json\n{\n  "emailUpdates": false,'))
  assert.ok(report!.includes('\n[1]: https://example.invalid/help/refunds'))
  assert.ok(!report!.includes('\\n'), 'The detailed inspection must not escape its line breaks.')
  assert.ok(memory && !memory.includes(evidence))
  const memoryLine = memory.split('\n').find((line) => line.startsWith('- `evidence`: '))!
  const memoryPreview = memoryLine.slice('- `evidence`: '.length).split(' — ')[0]!

  assert.ok(memoryPreview.includes('[truncated]'))
  assert.ok(getTokenizer().count(memoryPreview) <= 60, 'Named memory must retain only a bounded compact preview.')

  const second = await review.run(
    'Turn 2: inspect a larger retrieval while preserving its complete stored value',
    [
      codeReply(`const largeEvidence = await searchHelp({ query: 'all refund review guidance', detail: 'full' });

return inspect(largeEvidence);`),
      codeReply(
        `return exit('listen');`,
        'The visible guidance asks you to keep your account email, invoice number, and payment date ready for a refund review. The retrieved document is longer than the displayed excerpt; I have retained it for any follow-up. [Refund guide](https://example.invalid/help/refunds)'
      ),
    ],
    {
      tools,
      messages: [
        { role: 'user', content: 'Retrieve the full refund guidance and tell me what information to prepare.' },
      ],
      streaming: true,
    }
  )

  assert.ok(second.is(ListenExit))
  assert.equal(searches, 2)
  assert.equal(review.session.memory.variables.evidence, evidence)
  assert.equal(review.session.memory.variables.largeEvidence, largeEvidence)
  const secondRun = executions(review.scenario)[1]!
  assert.equal(secondRun.requests.length, 2)
  const secondReport = secondRun.requests[1]!.messages.filter((message) => message.type === 'tool_result').at(-1)
  const secondContent = String(secondReport?.content)
  const inspection = secondContent.split('\n\n<runtime-memory>\n')[0]!.split('inspect() result\n')[1]!.trim()

  assert.ok(inspection.includes('# Refund eligibility\n\n'))
  assert.ok(inspection.includes('[truncated]'))
  assert.ok(!inspection.includes('END_OF_COMPLETE_RETRIEVED_DOCUMENT'))
  assert.ok(!inspection.includes('\\n'))
  assert.ok(getTokenizer().count(inspection) <= 2000, 'The large inspection must stay within its token budget.')
  review.note(
    'Verified offline: each search ran once, both replies ended with listen, Markdown formatting survived the actual next-request capture, the full document appeared once alongside a compact memory preview, and the larger inspection stayed within 2,000 tokens while its complete value remained in memory.'
  )

  return review.scenario
}

async function toolResultBudgets() {
  const { review, settings } = createReview(
    '14-tool-result-budgets',
    'Default inspection budget and an explicit large retrieval override',
    'Two offline search fixtures return the same complete Markdown document. The ordinary search uses the default 2,000-token display budget. The full-document search attaches a 40,000-token host display allowance; JavaScript still receives a plain string and the second request can inspect the late source clause. These are scripted local replies, not provider inference.'
  )
  const source = [
    '# Billing review handbook',
    '',
    'This retrieved handbook describes invoice preparation and exception handling. [1]',
    '',
    ...Array.from(
      { length: 200 },
      (_, index) =>
        `## Guidance ${index + 1}\n\nKeep the original invoice, account email, and payment date. Billing support checks the subscription history and prior refunds before making a decision. A request is a review, not a guaranteed refund. [1]\n`
    ),
    '## Final exception clause',
    '',
    'LATE_SOURCE_CLAUSE: Renewal disputes must include the renewal notice and are routed to billing support. [1]',
    '',
    '[1]: https://example.invalid/help/billing-review "Billing review handbook"',
  ].join('\n')
  const calls = { normal: 0, full: 0 }
  const tools = [
    ...settings.tools,
    new Tool({
      name: 'searchBilling',
      description: 'Search the billing handbook and return relevant source text.',
      output: z.string(),
      handler: async () => {
        calls.normal++

        return source
      },
    }),
    new Tool({
      name: 'readBillingHandbook',
      description: 'Retrieve the full billing handbook, including exception clauses and source references.',
      output: z.string(),
      handler: async () => {
        calls.full++

        return truncate({ value: source, maxTokens: 40_000 })
      },
    }),
  ]

  await review.run(
    'Turn 1: ordinary retrieval uses the default inspection budget',
    [
      codeReply(`const evidence = await searchBilling();

return inspect(evidence);`),
      codeReply(
        `return exit('listen');`,
        'Prepare your original invoice, account email, and payment date. The retrieved handbook is longer than the displayed excerpt, so I have not yet reviewed its final exception clause.'
      ),
    ],
    {
      tools,
      messages: [{ role: 'user', content: 'Find the billing review guidance and tell me what to prepare.' }],
      streaming: true,
    }
  )

  const firstRun = executions(review.scenario)[0]!
  const firstReport = firstRun.requests[1]!.messages.filter((message) => message.type === 'tool_result').at(-1)
  const firstInspection = String(firstReport?.content)
    .split('\n\n<runtime-memory>\n')[0]!
    .split('inspect() result\n')[1]!
    .trim()

  assert.ok(firstInspection.includes('[truncated]'))
  assert.ok(!firstInspection.includes('LATE_SOURCE_CLAUSE'))
  assert.ok(getTokenizer().count(firstInspection) <= 2000)
  assert.equal(review.session.memory.variables.evidence, source)

  await review.run(
    'Turn 2: host-authorized larger retrieval exposes the final source clause',
    [
      codeReply(`const handbook = await readBillingHandbook();
const handbookType = typeof handbook;
const heading = handbook.slice(0, 25);

return inspect(handbook);`),
      codeReply(
        `return exit('listen');`,
        'The final clause says renewal disputes must include the renewal notice and go to billing support. [Billing review handbook](https://example.invalid/help/billing-review)'
      ),
    ],
    {
      tools,
      messages: [{ role: 'user', content: 'Read the full handbook and check its final exception clause.' }],
      streaming: true,
    }
  )

  const secondRun = executions(review.scenario)[1]!
  const secondReport = secondRun.requests[1]!.messages.filter((message) => message.type === 'tool_result').at(-1)
  const secondInspection = String(secondReport?.content)
    .split('\n\n<runtime-memory>\n')[0]!
    .split('inspect() result\n')[1]!
    .trim()

  assert.deepEqual(calls, { normal: 1, full: 1 })
  assert.equal(firstRun.requests.length, 2)
  assert.equal(secondRun.requests.length, 2)
  assert.ok(secondInspection.includes('# Billing review handbook\n\n'))
  assert.ok(secondInspection.includes('LATE_SOURCE_CLAUSE'))
  assert.ok(getTokenizer().count(secondInspection) > 2000)
  assert.ok(getTokenizer().count(secondInspection) <= 40_000)
  assert.equal(review.session.memory.variables.evidence, source)
  assert.equal(review.session.memory.variables.handbook, source)
  assert.equal(review.session.memory.variables.handbookType, 'string')
  assert.equal(review.session.memory.variables.heading, source.slice(0, 25))
  assert.equal(review.session.getBindings().$return, source)
  assert.ok(!JSON.stringify(review.session.toJSON()).includes('$$truncate'))
  review.note(
    'Verified offline: each search ran once. The ordinary inspection was limited to 2,000 tokens; the explicitly allowed inspection exceeded 2,000 and exposed the final clause while staying below 40,000. JavaScript string methods worked normally, both complete strings remained in memory, and no display wrapper entered the session.'
  )

  return review.scenario
}

async function plainTextResponse() {
  const { calls: _calls, ...settings } = createFixtures()
  const review = new PromptReview(
    {
      name: '15-plain-text-response',
      title: 'Plain text response preset without rich components',
      description:
        'Chat.response selects plain text independently of the rich component catalog. The response handler receives a string, and the stream delivers text deltas. No text, Markdown, or speech component method is registered.',
    },
    { ...settings, response: 'text', components: [] }
  )

  await review.run(
    'Deliver ordinary assistant text through the selected response handler',
    [textReply('The Standard plan costs $20 per month. The Team plan costs $50 per month.')],
    {
      messages: [{ role: 'user', content: 'Compare the plan prices in plain text.' }],
      streaming: true,
    }
  )

  const run = executions(review.scenario)[0]!
  const prompt = run.requests[0]!.messages.filter((message) => message.role === 'system')
    .map((message) => String(message.content))
    .join('\n')

  assert.match(prompt, /Write plain text directly/)
  assert.doesNotMatch(prompt, /(?:text|markdown|speech)\(props:/)
  assert.deepEqual(run.delivered, [
    { type: 'text', text: 'The Standard plan costs $20 per month. The Team plan costs $50 per month.' },
  ])
  assert.ok(run.deltas.some((delta) => !delta.restart && delta.type === 'text' && delta.delta))
  review.note('Verified: plain text instructions are present, text streams normally, and no rich component is needed.')

  return review.scenario
}

async function customResponse() {
  const { calls: _calls, ...settings } = createFixtures()
  const instructions = 'Write one concise line beginning with "Support:". Use ordinary sentences without Markdown.'
  const review = new PromptReview(
    {
      name: '16-custom-response-and-flat-components',
      title: 'Custom response instructions with flat card and carousel props',
      description:
        'Custom response instructions guide streamed assistant text. Separate Card and Carousel handlers receive flat validated props, including card text, nested image data, and button data. One JavaScript call sends both rich components and exits to listen.',
    },
    {
      ...settings,
      response: { instructions },
      components: [DefaultComponents.Card, DefaultComponents.Carousel],
    }
  )

  await review.run(
    'Custom assistant text and two rich components use their own handlers',
    [
      codeReply(
        `chat.card({ title: 'Current plan', text: 'Standard is $20 per month.' });
chat.carousel({ cards: [
  { title: 'Standard', text: 'For individual projects.', image: { url: '${media.image}', alt: 'Standard plan' } },
  { title: 'Team', text: 'For shared projects.', buttons: [{ action: 'say', label: 'Choose Team' }] },
] });

return exit('listen');`,
        'Support: Here are your current plan and the available choices.'
      ),
    ],
    { messages: [{ role: 'user', content: 'Show my current plan and the plan choices.' }], streaming: true }
  )

  const run = executions(review.scenario)[0]!
  const prompt = run.requests[0]!.messages.filter((message) => message.role === 'system')
    .map((message) => String(message.content))
    .join('\n')
  const rich = run.delivered.filter((message) => message.type === 'component')

  assert.ok(prompt.includes(instructions))
  assert.doesNotMatch(prompt, /Write natural Markdown directly/)
  assert.deepEqual(rich, [
    DefaultComponents.Card.render({ title: 'Current plan', text: 'Standard is $20 per month.' }),
    DefaultComponents.Carousel.render({
      cards: [
        { title: 'Standard', text: 'For individual projects.', image: { url: media.image, alt: 'Standard plan' } },
        { title: 'Team', text: 'For shared projects.', buttons: [{ action: 'say', label: 'Choose Team' }] },
      ],
    }),
  ])
  assert.ok(rich.every((message) => !('children' in message) && !('body' in message)))
  assert.ok(run.deltas.every((delta) => !('component' in delta) && !('props' in delta)))
  assert.equal(run.requests.length, 1)
  review.note('Verified: response styling changes native text only; rich handlers receive flat props in call order.')

  return review.scenario
}

async function queuedSessionInput() {
  const { review } = createReview(
    '17-session-input-queue',
    'Queued input, persisted processing state, and retained memory',
    'Append a second user message while the first turn is executing. All iterations of the first turn see only its claimed input. Save and restore the session, then process the queued message once with the original history and named memory.'
  )
  const followUp = { role: 'user' as const, content: 'What plan did I ask you to remember?' }
  let queued = false

  await review.run(
    'Turn 1: retain a preference while the next user message waits',
    [
      codeReply("const preferredPlan = 'Team';\n\nreturn inspect({ preferredPlan });"),
      textReply('I will remember that you prefer Team.'),
    ],
    {
      messages: [{ role: 'user', content: 'Remember that I prefer Team.' }],
      onIterationStart: () => {
        if (!queued) {
          review.session.append(followUp)
          queued = true
        }
      },
    }
  )

  assert.equal(review.session.status, 'pending')
  assert.deepEqual(review.session.pendingMessages, [followUp])

  for (const request of executions(review.scenario)[0]!.requests) {
    assert.ok(!JSON.stringify(request.messages).includes(followUp.content))
  }

  review.session = Session.fromJSON(JSON.parse(JSON.stringify(review.session.toJSON())))
  review.note('The restored session retains the pending message and named preference. No history is submitted again.')

  await review.run('Turn 2: consume the restored pending message and inspect existing memory', [
    codeReply('return inspect({ preferredPlan });'),
    textReply('You asked me to remember Team.'),
  ])

  const request = executions(review.scenario)[1]!.requests[0]!
  assert.equal(JSON.stringify(request.messages).split(followUp.content).length - 1, 1)
  assert.equal(review.session.turn, 2)
  assert.equal(review.session.status, 'idle')
  assert.deepEqual(review.session.pendingMessages, [])
  assert.equal(review.session.memory.variables.preferredPlan, 'Team')
  review.note('Verified: pending input stayed outside the active prompts, survived persistence, and was consumed once.')

  return review.scenario
}
