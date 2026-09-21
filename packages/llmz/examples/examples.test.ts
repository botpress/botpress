import { Cognitive } from '@botpress/cognitive'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { NativeStreamClient, javascript, response } from '../src/runtime/fixtures/native-client.js'
import type { ExecutionProps, ExecutionResult } from '../src/index.js'
import { listExamples } from './start.js'

const state = vi.hoisted(() => ({
  run: undefined as undefined | ((props: ExecutionProps) => Promise<ExecutionResult>),
  files: new Map<
    string,
    { id: string; key: string; content: string; status: string; url: string; tags: Record<string, string> }
  >(),
}))
vi.mock('llmz', async () => {
  const actual = await vi.importActual<typeof import('../src/index.js')>('llmz')
  return { ...actual, execute: (props: ExecutionProps) => state.run!(props) }
})
vi.mock('./utils/buttons', () => ({ prompt: vi.fn(async () => 'OVERWRITE') }))
vi.mock('./utils/spinner', () => ({ loading: vi.fn() }))
vi.mock('@botpress/client', () => ({
  Client: class {
    uploadFile = vi.fn(async (input) => {
      const file = { ...input, id: input.key, url: `https://files.example/${input.key}`, status: 'indexing_completed' }
      state.files.set(input.key, file)
      return { file }
    })
    getFile = vi.fn(async ({ id }) => ({ file: state.files.get(id) }))
    searchFiles = vi.fn(async () => ({
      passages: [{ file: { key: 'hr.md', tags: { title: 'HR' } }, content: 'Vacation allowance: 20 days.' }],
    }))
    list = { files: () => ({ collect: async () => [...state.files.values()] }) }
    callAction = vi.fn(async ({ type }) => ({
      output: {
        results:
          type === 'browser:webSearch'
            ? [{ name: 'Example', url: 'https://example.org', snippet: 'Sample page' }]
            : [{ url: 'https://example.org', content: 'Sample page' }],
      },
    }))
  },
}))

import { CLIChat } from './utils/cli-chat.js'

const cases = [
  [
    '01_chat_basic',
    [[response('Hello!', javascript('chat.buttons([{action:"say",label:"Hello"}]); return exit("listen")').toolCalls)]],
  ],
  ['02_chat_exits', [[response('Hello!')]]],
  [
    '03_chat_conditional_tool',
    [
      [
        javascript('return inspect(await login({userId:"admin",password:"password"}))'),
        javascript('await reset_database(); return exit("listen")'),
      ],
    ],
  ],
  [
    '04_chat_small_models',
    [
      [
        javascript('return inspect(await listTickets({}))'),
        javascript('await closeTicket({ticketId:"123"}); return exit("listen")'),
      ],
    ],
  ],
  [
    '05_chat_web_search',
    [
      [
        javascript('return inspect(await browser_webSearch({query:"example"}))'),
        javascript('return inspect(await browser_browsePages({urls:["https://example.org"]}))'),
        response('Found a sample page.'),
      ],
    ],
  ],
  ['06_chat_confirm_tool', [[javascript('const result = await overwrite(); return exit("listen")')]]],
  ['07_chat_guardrails', [[response('Hello, how can I help?')]]],
  [
    '08_chat_multi_agent',
    [
      [javascript('return exit("handoff_hr", {message:"Benefits question"})')],
      [
        javascript('return inspect(await getEmployeeBenefits("employee-1"))'),
        javascript('return exit("end_conversation")'),
      ],
    ],
  ],
  [
    '09_chat_variables',
    [
      [
        javascript(
          'user.name = "Alex"; user.age = 30; user.email = "alex@example.org"; return exit("profile_completed", {})'
        ),
      ],
    ],
  ],
  [
    '10_chat_components',
    [
      [
        javascript(
          'const t = await purchase_ticket({from:"New York",to:"Los Angeles",date:"2031-10-01"}); chat.planeTicket({ticketNumber:t.ticketNumber,price:t.price,from:"New York",to:"Los Angeles",date:"2031-10-01"}); return exit("listen")'
        ),
      ],
    ],
  ],
  [
    '11_worker_minimal',
    [
      [
        javascript(
          'let total=0; for(let n=14;n<=1078;n++) if(n%3===0||n%9===0||n%5===0) total+=n; return exit("done",{success:true,result:total})'
        ),
      ],
    ],
  ],
  [
    '12_worker_fs',
    [
      [
        javascript(
          'await fs.writeFile({path:"/notes/demo.txt",content:"Hello, world!"}); const text = await fs.readFile("/notes/demo.txt"); return exit("exit",{message:text})'
        ),
      ],
    ],
  ],
  [
    '13_worker_sandbox',
    [[javascript('for(let n=0;n<100;n++) await wait({ms:500}); return exit("done",{success:true})')]],
  ],
  [
    '14_worker_snapshot',
    [[javascript('return exit("saved",{reference})')], [javascript('return exit("reviewed",{reference,paid:true})')]],
  ],
  ['15_worker_stacktraces', [[javascript('await demo(); return exit("exit",{message:"Unexpected success"})')]]],
  [
    '16_worker_tool_chaining',
    [
      [
        javascript(
          'const a=await tool_a(); const b=await tool_b(); const result=await tool_c({first_task:a.pick.deep.deep_number,second_task:b.filter(n=>n>50)}); return exit("exit",{result})'
        ),
      ],
    ],
  ],
  [
    '17_worker_error_recovery',
    [
      [
        javascript('return inspect(await getCode({}))'),
        javascript(
          'const result=await getCode({input:"hello, world"}); return exit("done",{success:true,result:result.code})'
        ),
      ],
    ],
  ],
  ['18_worker_security', Array.from({ length: 15 }, () => [javascript('return exit("exit")')])],
  [
    '19_worker_wrap_tool',
    [[javascript('const value=await greet({greeting:"Alex"}); return exit("exit",{result:value.added})')]],
  ],
  ['20_chat_rag', [[javascript('return inspect(await search("vacation"))'), response('The allowance is 20 days.')]]],
  [
    '22_chat_streaming',
    [
      [
        javascript(
          'const dates=await checkAvailability({destination:"moon"}); const booking=await bookTrip({destination:"moon",date:dates[0],travelerName:"Alex"}); const payment=await processPayment({reservationId:booking.reservationId}); return exit("booked",{confirmationId:payment.confirmationId,amountUsd:payment.amountUsd,destination:"moon",date:dates[0],travelerName:"Alex"})'
        ),
      ],
    ],
  ],
] as const

beforeEach(() => {
  state.files.clear()
  vi.spyOn(Cognitive.prototype, 'generateText').mockResolvedValue(response('{"violations":[]}'))
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
  vi.spyOn(CLIChat.prototype, 'iterate').mockResolvedValueOnce(true).mockResolvedValue(false)
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const file = [...state.files.values()].find((entry) => entry.url === url)
      if (!file) throw new Error(`Unexpected network request: ${url}`)
      return new Response(file.content)
    })
  )
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('example entry points (offline)', () => {
  it('covers every runnable example', () => {
    expect(cases.map(([name]) => name).sort()).toEqual(listExamples())
  })

  it.each(cases)(
    '%s executes against the current runtime',
    async (name, runs) => {
      const actual = await vi.importActual<typeof import('../src/index.js')>('llmz')
      const results: ExecutionResult[] = []
      let index = 0
      state.run = async (props) => {
        const planned = runs[index++]
        expect(planned, 'Unexpected extra execution').toBeDefined()
        const client = new NativeStreamClient(structuredClone([...planned!]))
        const result = await actual.execute({ ...props, client })
        results.push(result)
        expect(client.responses).toHaveLength(0)
        if (name === '13_worker_sandbox' || name === '15_worker_stacktraces' || name === '18_worker_security') {
          expect(result.isError()).toBe(true)
        } else {
          expect(result.isSuccess(), result.isError() ? String(result.error) : result.status).toBe(true)
        }
        return result
      }
      await import(`./${name}/index.ts`)
      expect(results).toHaveLength(runs.length)
      if (name === '14_worker_snapshot') {
        expect(results[1]!.session).not.toBe(results[0]!.session)
        expect(results[1]!.session.transcript.some((entry) => entry.role === 'event')).toBe(true)
        expect(results[1]!.output).toEqual({ reference: 'order-42', paid: true })
      }
      if (name === '17_worker_error_recovery') expect(results[0]!.output).toEqual({ success: true, result: 6600 })
      if (name === '19_worker_wrap_tool') expect(results[0]!.output).toEqual({ result: 666 })
    },
    20_000
  )
})
