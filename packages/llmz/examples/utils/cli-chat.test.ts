import { afterEach, expect, it, vi } from 'vitest'
import { Chat, ListenExit, Session, execute } from '../../src/index.js'
import { NativeClient, NativeStreamClient, javascript, response } from '../../src/runtime/fixtures/native-client.js'
import { CLIChat } from './cli-chat.js'
import { prompt } from './buttons.js'

vi.mock('./buttons', () => ({ prompt: vi.fn() }))
afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

it('keeps one session across turns and stops on an empty terminal reply', async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  const chat = new CLIChat()
  expect(await chat.iterate()).toBe(true)
  const result = await execute({ chat, session: chat.session, client: new NativeClient([response('Hello')]) })
  expect(result.is(ListenExit)).toBe(true)
  vi.mocked(prompt).mockResolvedValueOnce('Next question').mockResolvedValueOnce('')
  expect(await chat.iterate()).toBe(true)
  expect(chat.session.pendingMessages.at(-1)?.content).toBe('Next question')
  expect(await chat.iterate()).toBe(false)
})

it('checks assistant text before displaying it', async () => {
  const print = vi.spyOn(console, 'log').mockImplementation(() => {})
  const validateText = vi.fn(async () => {
    throw new Error('blocked')
  })
  const chat = new CLIChat({ validateText })
  const result = await execute({
    chat,
    session: new Session(),
    client: new NativeClient([response('Forbidden reply')]),
    options: { loop: 1 },
  })
  expect(result.isError()).toBe(true)
  expect(validateText).toHaveBeenCalledWith('Forbidden reply')
  expect(print).not.toHaveBeenCalled()
  expect(chat).toBeInstanceOf(Chat)
})

it('prints the greeting alongside buttons before prompting for a reply', async () => {
  const print = vi.spyOn(console, 'log').mockImplementation(() => {})
  const chat = new CLIChat()
  const client = new NativeStreamClient([
    response(
      'Hello! What would you like to discuss?',
      javascript(
        'chat.buttons([{ action: "say", label: "Science" }, { action: "say", label: "Travel" }]); return exit("listen")'
      ).toolCalls
    ),
  ])
  const result = await execute({ chat, session: chat.session, client })
  expect(result.is(ListenExit)).toBe(true)
  expect(print).toHaveBeenCalledTimes(1)
  expect(print).toHaveBeenCalledWith(expect.stringContaining('Hello! What would you like to discuss?'))
  expect(prompt).not.toHaveBeenCalled()
  vi.mocked(prompt).mockResolvedValueOnce('Science')
  expect(await chat.iterate()).toBe(true)
  expect(prompt).toHaveBeenCalledWith(expect.any(String), ['Science', 'Travel'])
  expect(chat.session.pendingMessages.at(-1)?.content).toBe('Science')
})
