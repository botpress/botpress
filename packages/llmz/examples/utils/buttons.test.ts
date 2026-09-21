import { EventEmitter } from 'node:events'
import { stripVTControlCharacters } from 'node:util'
import { afterEach, expect, it, vi } from 'vitest'
import { prompt } from './buttons.js'

afterEach(() => vi.restoreAllMocks())

it('keeps long replies on one editing row, submits the full text, and releases input between prompts', async () => {
  const input = Object.assign(new EventEmitter(), {
    isTTY: true,
    setRawMode: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  })
  const write = vi.fn((_chunk: string) => true)
  const output = { isTTY: true, columns: 40, write }
  vi.spyOn(process, 'stdin', 'get').mockReturnValue(input as unknown as typeof process.stdin)
  vi.spyOn(process, 'stdout', 'get').mockReturnValue(output as unknown as typeof process.stdout)

  const reply = 'A long reply that should scroll horizontally without losing any of its text.'
  const first = prompt('Reply: ')
  for (const character of reply) input.emit('keypress', character, { name: character })
  const rendered = write.mock.calls.map((args) => stripVTControlCharacters(String(args[0] ?? '')))
  expect(rendered.at(-1)).toContain('of its text.')
  expect(rendered.filter((line) => line.startsWith('> ')).every((line) => line.length < 40)).toBe(true)
  input.emit('keypress', '\r', { name: 'return' })
  await expect(first).resolves.toBe(reply)
  expect(input.listenerCount('keypress')).toBe(0)
  expect(input.pause).toHaveBeenCalledTimes(1)

  const second = prompt('Again: ')
  expect(input.resume).toHaveBeenCalledTimes(2)
  input.emit('keypress', '\r', { name: 'return' })
  await expect(second).resolves.toBe('')
  expect(input.pause).toHaveBeenCalledTimes(2)
})
