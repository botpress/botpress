import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, expect, it, vi } from 'vitest'
import { listExamples, resolveExample, loadEnvironment } from './start.js'

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'llmz-examples-'))
afterEach(() => {
  vi.unstubAllEnvs()
  fs.rmSync(directory, { recursive: true, force: true })
})

it('discovers runnable entries and resolves numeric shortcuts before loading environment files', () => {
  fs.mkdirSync(path.join(directory, '01_chat_basic'), { recursive: true })
  fs.mkdirSync(path.join(directory, '02_worker_missing'))
  fs.writeFileSync(path.join(directory, '01_chat_basic/index.ts'), '')
  expect(listExamples(directory)).toEqual(['01_chat_basic'])
  expect(resolveExample('01', directory)).toBe('01_chat_basic')
  expect(resolveExample('02', directory)).toBeUndefined()

  vi.stubEnv('LLMZ_EXAMPLE_SHARED', undefined)
  vi.stubEnv('LLMZ_EXAMPLE_OVERRIDE', undefined)
  vi.stubEnv('LLMZ_EXAMPLE_SHELL', 'shell')
  fs.writeFileSync(
    path.join(directory, '.env'),
    'LLMZ_EXAMPLE_SHARED=shared\nLLMZ_EXAMPLE_OVERRIDE=shared\nLLMZ_EXAMPLE_SHELL=shared'
  )
  fs.writeFileSync(path.join(directory, '01_chat_basic/.env'), 'LLMZ_EXAMPLE_OVERRIDE=local\nLLMZ_EXAMPLE_SHELL=local')
  loadEnvironment(resolveExample('01', directory)!, directory)
  expect(process.env.LLMZ_EXAMPLE_SHARED).toBe('shared')
  expect(process.env.LLMZ_EXAMPLE_OVERRIDE).toBe('local')
  expect(process.env.LLMZ_EXAMPLE_SHELL).toBe('shell')
})
