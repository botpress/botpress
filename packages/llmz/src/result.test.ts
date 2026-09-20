import { expect, test } from 'vitest'

import { Chat } from './chat/chat.js'
import { executeContext } from './runtime/execute.js'
import { NativeClient, javascript, response } from './runtime/fixtures/native-client.js'

test('serializes a compact outcome while Session owns durable history and memory', async () => {
  const client = new NativeClient([
    javascript('const account = { id: 42 }; return inspect(account);'),
    response('Done.'),
  ])
  const result = await executeContext({ client, chat: new Chat() })
  const summary = result.toJSON()

  expect(summary).toMatchObject({ status: 'success', sessionId: result.session.id, exit: 'listen' })
  expect(summary).not.toHaveProperty('context')
  expect(summary).not.toHaveProperty('session')
  expect(result.diagnostics()).toHaveProperty('iterations')
  expect(result.diagnostics()).not.toHaveProperty('session')
  expect(result.diagnostics().iterations[0]).not.toHaveProperty('messages')
  expect(result.diagnostics().iterations[0]).not.toHaveProperty('variables')
  expect(result.session.memory.variables.account).toEqual({ id: 42 })
  expect(result.session.messages.some((message) => message.type === 'tool_result')).toBe(true)
})
