import { z } from '@bpinternal/zui'
import { test, expect } from 'vitest'
import { listable, creatable, readable, updatable, deletable } from './sync'

const issue = { name: 'Issue', schema: z.object({ id: z.string() }) }

test('listable resolve naming', () => {
  const { implementStatement } = listable.resolve({ entities: { item: issue } })
  expect(implementStatement.actions.list.name).toEqual('issueList')
})
test('creatable resolve naming', () => {
  const { implementStatement } = creatable.resolve({ entities: { item: issue } })
  expect(implementStatement.actions.create.name).toEqual('issueCreate')
  expect(implementStatement.events.created.name).toEqual('issueCreated')
})
test('readable resolve naming', () => {
  const { implementStatement } = readable.resolve({ entities: { item: issue } })
  expect(implementStatement.actions.read.name).toEqual('issueRead')
})
test('updatable resolve naming', () => {
  const { implementStatement } = updatable.resolve({ entities: { item: issue } })
  expect(implementStatement.actions.update.name).toEqual('issueUpdate')
  expect(implementStatement.events.updated.name).toEqual('issueUpdated')
})
test('deletable resolve naming', () => {
  const { implementStatement } = deletable.resolve({ entities: { item: issue } })
  expect(implementStatement.actions.delete.name).toEqual('issueDelete')
  expect(implementStatement.events.deleted.name).toEqual('issueDeleted')
})
