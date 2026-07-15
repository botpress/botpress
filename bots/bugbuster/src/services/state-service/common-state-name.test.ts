import { expect, it, describe } from 'vitest'
import { findCommonStateName } from './common-state-name'

describe('findCommonStateName', () => {
  it('should correctly map all supported states of type Triage', () => {
    expect(findCommonStateName({ name: 'Triage', type: 'triage' })).toBe('TRIAGE')
  })

  it('should correctly map all supported states of type Backlog', () => {
    expect(findCommonStateName({ name: 'Icebox', type: 'backlog' })).toBeUndefined()
    expect(findCommonStateName({ name: 'Incomplete', type: 'backlog' })).toBeUndefined()
    expect(findCommonStateName({ name: 'N/A', type: 'backlog' })).toBeUndefined()
    expect(findCommonStateName({ name: 'Backlog', type: 'backlog' })).toBe('BACKLOG')
  })

  it('should correctly map all supported states of type Unstarted', () => {
    expect(findCommonStateName({ name: 'Up next', type: 'unstarted' })).toBeUndefined()
    expect(findCommonStateName({ name: 'N/A', type: 'unstarted' })).toBeUndefined()
    expect(findCommonStateName({ name: 'Todo', type: 'unstarted' })).toBe('TODO')
  })

  it('should correctly map all supported states of type Started', () => {
    expect(findCommonStateName({ name: 'N/A', type: 'started' })).toBeUndefined()
    expect(findCommonStateName({ name: 'Blocked', type: 'started' })).toBe('BLOCKED')
    expect(findCommonStateName({ name: 'In Prod Testing', type: 'started' })).toBe('MONITORING')
    expect(findCommonStateName({ name: 'Monitoring', type: 'started' })).toBe('MONITORING')
    expect(findCommonStateName({ name: 'In Progress', type: 'started' })).toBe('IN_PROGRESS')
    expect(findCommonStateName({ name: 'Staging', type: 'started' })).toBe('STAGING')
    expect(findCommonStateName({ name: 'In Review', type: 'started' })).toBe('IN_REVIEW')
    expect(findCommonStateName({ name: 'In PR Review', type: 'started' })).toBe('IN_REVIEW')
  })

  it('should correctly map all supported states of type Completed', () => {
    expect(findCommonStateName({ name: 'Done', type: 'completed' })).toBe('DONE')
    expect(findCommonStateName({ name: 'Production', type: 'completed' })).toBe('DONE')
    expect(findCommonStateName({ name: 'Production (Done)', type: 'completed' })).toBe('DONE')
  })

  it('should correctly map all supported states of type Canceled', () => {
    expect(findCommonStateName({ name: 'Stale', type: 'canceled' })).toBe('STALE')
    expect(findCommonStateName({ name: 'Canceled', type: 'canceled' })).toBe('CANCELED')
  })

  it('should correctly map all supported states of type Duplicate', () => {
    expect(findCommonStateName({ name: 'Duplicate', type: 'duplicate' })).toBe('DUPLICATE')
  })
})
