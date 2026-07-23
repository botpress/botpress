/**
 * Example 22: Streaming Chat — guided simulation
 *
 * An interactive "space travel agency" that demonstrates, in one place, how
 * everything an execution produces can be surfaced to the client in real
 * time — here the "client" is the terminal, but the exact same pattern
 * applies to a websocket, an SSE response or any other transport.
 *
 * It shows how to:
 * - Stream message bodies token-by-token with `Chat.onMessageDelta`
 * - Receive the complete, authoritative message with `handler`
 * - Display the generated code and tool calls (input, output, duration)
 *   live with the `onTrace` hook
 * - Define typed exits and render them when the agent ends the conversation
 * - Read per-turn stats: model, iterations, tokens and time-to-first-token
 *
 * Because LLMz is code-first, finalizing a booking requires *chaining* two
 * tools — `bookTrip` returns a reservation that `processPayment` must pay to
 * obtain the confirmation id the `booked` exit requires. The agent does both
 * in a single generated code block, something JSON tool-calling would need
 * two roundtrips for.
 */

import { Cognitive } from '@botpress/cognitive'
import { z } from '@bpinternal/zui'
import chalk from 'chalk'
import { Chat, DefaultComponents, Exit, ListenExit, Tool, execute, isComponent, type ExecutionResult } from 'llmz'

import { prompt } from '../utils/buttons'

// Streaming requires the Cognitive v2 (beta) client. A regular Botpress
// client also works, but messages are then delivered whole, not streamed.
const client = new Cognitive({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

// ────────────────────────────────────────────────────────────────────────────
// Tools — the agent orchestrates these from generated code
// ────────────────────────────────────────────────────────────────────────────

const DESTINATIONS = [
  { id: 'moon', name: 'The Moon', price: 125_000, durationDays: 6 },
  { id: 'mars', name: 'Mars', price: 890_000, durationDays: 210 },
  { id: 'europa', name: 'Europa (Jupiter)', price: 2_400_000, durationDays: 550 },
]

const listDestinations = new Tool({
  name: 'listDestinations',
  description: 'Lists the available space travel destinations with prices',
  output: z.array(z.object({ id: z.string(), name: z.string(), price: z.number(), durationDays: z.number() })),
  handler: async () => DESTINATIONS,
})

const checkAvailability = new Tool({
  name: 'checkAvailability',
  description: 'Returns the next launch dates for a destination',
  input: z.object({ destination: z.string().describe('Destination id, e.g. "mars"') }),
  output: z.array(z.string().describe('Launch date (ISO)')),
  handler: async ({ destination }) => {
    if (!DESTINATIONS.some((d) => d.id === destination)) {
      throw new Error(`Unknown destination "${destination}". Use listDestinations first.`)
    }
    return ['2026-09-14', '2026-11-02', '2027-01-21']
  },
})

// Booking is a two-step process: bookTrip only *reserves* — the reservation
// must then be paid with processPayment to obtain the confirmation id that
// the `booked` exit requires. The agent has to chain both calls in one
// generated code block.
const reservations = new Map<string, { totalUsd: number }>()

const bookTrip = new Tool({
  name: 'bookTrip',
  description:
    'Reserves a trip and returns an unpaid reservation. The reservation must be paid with processPayment to be confirmed.',
  input: z.object({
    destination: z.string(),
    date: z.string(),
    travelerName: z.string(),
  }),
  output: z.object({ reservationId: z.string(), totalUsd: z.number() }),
  handler: async ({ destination }) => {
    const trip = DESTINATIONS.find((d) => d.id === destination)
    if (!trip) {
      throw new Error(`Unknown destination "${destination}". Use listDestinations first.`)
    }
    const reservationId = `RSV-${destination.toUpperCase().slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`
    reservations.set(reservationId, { totalUsd: trip.price })
    return { reservationId, totalUsd: trip.price }
  },
})

const processPayment = new Tool({
  name: 'processPayment',
  description: 'Charges a reservation and returns the final confirmation id',
  input: z.object({ reservationId: z.string() }),
  output: z.object({ confirmationId: z.string(), amountUsd: z.number() }),
  handler: async ({ reservationId }) => {
    const reservation = reservations.get(reservationId)
    if (!reservation) {
      throw new Error(`Unknown reservation "${reservationId}". Reserve with bookTrip first.`)
    }
    return { confirmationId: reservationId.replace('RSV-', 'SP-'), amountUsd: reservation.totalUsd }
  },
})

// ────────────────────────────────────────────────────────────────────────────
// Exits — typed terminal states for the conversation
// ────────────────────────────────────────────────────────────────────────────

const booked = new Exit({
  name: 'booked',
  description: 'The trip was reserved AND paid. Requires the confirmation id returned by processPayment.',
  schema: z.object({
    confirmationId: z.string().describe('The confirmation id returned by processPayment (starts with SP-)'),
    destination: z.string(),
    date: z.string(),
    travelerName: z.string(),
    amountUsd: z.number(),
  }),
})

const cancelled = new Exit({
  name: 'cancelled',
  description: 'The user decided not to book a trip',
  schema: z.object({ reason: z.string() }),
})

// ────────────────────────────────────────────────────────────────────────────
// Chat — streaming rendering of messages, buttons, tool calls and exits
// ────────────────────────────────────────────────────────────────────────────

const transcript: Array<{ role: 'user' | 'assistant'; content: string }> = []
let buttons: string[] = []

// The id of the message currently being streamed to the terminal, if any
let streaming: string | null = null

const compact = (value: unknown, max = 80): string => {
  const str = JSON.stringify(value) ?? 'undefined'
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}

const chat = new Chat({
  components: [DefaultComponents.Text, DefaultComponents.Button],
  transcript: () => transcript,

  // Called for every chunk of a message body, while the LLM is still
  // generating. Print chunks as they arrive for a live typewriter effect.
  onMessageDelta: (delta) => {
    if (streaming !== delta.id) {
      streaming = delta.id
      process.stdout.write(chalk.bold('🤖 Agent: '))
    }
    process.stdout.write(delta.delta)
  },

  // Called once per complete message — the authoritative delivery
  handler: async (component) => {
    if (isComponent(component, DefaultComponents.Button)) {
      buttons.push(component.props.label)
      return
    }

    const text = component.children
      .filter((child) => typeof child === 'string')
      .join('')
      .trim()

    if (!text.length) {
      return
    }

    transcript.push({ role: 'assistant', content: text })

    if (streaming) {
      // The body was already printed live by onMessageDelta — just end the line
      streaming = null
      process.stdout.write('\n')
    } else {
      // Fallback for non-streaming clients: print the whole message at once
      console.log(`${chalk.bold('🤖 Agent:')} ${text}`)
    }
  },
})

// ────────────────────────────────────────────────────────────────────────────
// Stats footer — model, turns and last-iteration numbers after each turn
// ────────────────────────────────────────────────────────────────────────────

let turns = 0

const printStats = (result: ExecutionResult) => {
  const iteration = result.iteration
  const llm = iteration?.llm
  const tokens = iteration?.tokens

  const generationMs = llm ? llm.ended_at - llm.started_at : undefined
  const parts = [
    `model ${llm?.model ?? 'n/a'}`,
    `turns ${turns}`,
    `iterations ${result.iterations.length}`,
    `code generation ${generationMs !== undefined ? `${generationMs}ms` : 'n/a'}`,
    `tokens in ${tokens?.input.toLocaleString('en-US') ?? 'n/a'}`,
    `tokens out ${tokens?.output.toLocaleString('en-US') ?? 'n/a'}`,
    `ttft ${llm?.time_to_first_token !== undefined ? `${llm.time_to_first_token}ms` : 'n/a'}`,
  ]
  console.log(chalk.dim(`   ─ ${parts.join(' · ')}`))
}

// ────────────────────────────────────────────────────────────────────────────
// Conversation loop
// ────────────────────────────────────────────────────────────────────────────

console.log(chalk.bold.cyan('🚀 Space Travel Agency — guided simulation'))
console.log(chalk.dim('Watch messages stream in, code + tool calls execute live, and typed exits end the trip.\n'))

// Kick off the guided tour: the agent speaks first
transcript.push({ role: 'user', content: 'Hi! Give me the tour.' })

while (true) {
  turns++

  const result = await execute({
    instructions: [
      'You are the booking agent of a fictional space travel agency.',
      'Guide the user through booking a trip: list destinations (with prices), check launch dates, then ask for the traveler full name.',
      'Booking is a two-step process: bookTrip only reserves; the reservation must then be paid with processPayment to get the confirmation id.',
      'When the user confirms, reserve AND pay in the same code block (chain bookTrip into processPayment), then exit with "booked".',
      'Keep messages short and lively, and always suggest the next steps as buttons.',
      'If the user does not want to travel, exit with "cancelled".',
    ].join('\n'),
    chat,
    client,
    tools: [listDestinations, checkAvailability, bookTrip, processPayment],
    exits: [booked, cancelled],

    // Live feed of everything happening inside the iteration: show the code
    // the LLM generated, then each tool call as it completes
    onTrace: ({ trace }) => {
      // Fires as soon as the model starts writing a ■run block — the code is
      // still being generated at this point
      if (trace.type === 'code_generation_started') {
        console.log(chalk.dim('   ⏳ writing code…'))
      }

      if (trace.type === 'llm_call_success' && trace.code.trim().length) {
        console.log(chalk.dim('   ┌─ generated code'))
        for (const line of trace.code.trim().split('\n')) {
          console.log(chalk.dim(`   │ `) + chalk.magenta(line))
        }
        console.log(chalk.dim('   └─'))
      }

      if (trace.type === 'tool_call') {
        const duration = chalk.dim(`(${(trace.ended_at ?? trace.started_at) - trace.started_at}ms)`)
        const call = chalk.cyan(`${trace.tool_name}(${trace.input === undefined ? '' : compact(trace.input)})`)
        if (trace.success) {
          console.log(
            `   ${chalk.dim('⚙')} ${call} ${chalk.dim('→')} ${chalk.green(compact(trace.output))} ${duration}`
          )
        } else {
          console.log(`   ${chalk.dim('⚙')} ${call} ${chalk.dim('→')} ${chalk.red(compact(trace.error))} ${duration}`)
        }
      }
    },
  })

  printStats(result)

  // ── Exits ─────────────────────────────────────────────────────────────────
  if (result.is(booked)) {
    // result.output is fully typed from the exit schema
    console.log()
    console.log(chalk.bold.green('🎫 Trip booked!'))
    console.log(chalk.green(`   Confirmation: ${result.output.confirmationId}`))
    console.log(chalk.green(`   Destination:  ${result.output.destination}`))
    console.log(chalk.green(`   Launch date:  ${result.output.date}`))
    console.log(chalk.green(`   Traveler:     ${result.output.travelerName}`))
    console.log(chalk.green(`   Amount:       $${result.output.amountUsd.toLocaleString('en-US')}`))
    break
  }

  if (result.is(cancelled)) {
    console.log()
    console.log(chalk.bold.yellow('🚪 Conversation ended — no booking'))
    console.log(chalk.yellow(`   Reason: ${result.output.reason}`))
    break
  }

  if (!result.is(ListenExit)) {
    console.log(chalk.red(`✖ Execution ended unexpectedly: ${result.status}`))
    break
  }

  // ── The agent handed the turn back: ask the user ─────────────────────────
  const reply = await prompt(chalk.gray('(your reply) '), buttons)
  buttons = []

  if (!reply?.trim().length) {
    break
  }

  transcript.push({ role: 'user', content: reply })
  console.log(`${chalk.bold('👤 User:')} ${reply}`)
}
