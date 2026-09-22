import { describe, expect, it } from 'vitest'
import { InvalidSessionError } from '../errors.js'
import { Session, type SessionInput } from './session.js'

function delivered(session: Session) {
  const { id } = session.nextIteration()
  session.recordAssistantDelivery(id)
  session.settleIteration(id, { outcome: 'completed' })
  session.completeTurn()
}

describe('session last speaker', () => {
  it('updates queued input only when its turn starts', () => {
    const session = new Session()
    session.append({ role: 'user', content: 'First request' })
    expect(session.lastSpeaker).toBeNull()
    delivered(session)
    session.append({ role: 'user', content: 'Next request' })
    expect(session.lastSpeaker).toBe('assistant')

    const restored = Session.fromJSON(JSON.parse(JSON.stringify(session)))
    expect(restored.lastSpeaker).toBe('assistant')
    restored.beginTurn()
    expect(restored.lastSpeaker).toBe('user')
  })

  it('does not let input queued during execution invalidate the active reply', () => {
    const session = new Session()
    session.append({ role: 'user', content: 'First request' })
    const { id } = session.nextIteration()
    session.recordAssistantDelivery(id)
    session.append({ role: 'user', content: 'Next request' })
    session.beginTurn()
    expect(session.lastSpeaker).toBe('assistant')
    session.settleIteration(id, { outcome: 'completed' })
    session.completeTurn()
    session.beginTurn()
    expect(session.lastSpeaker).toBe('user')
  })

  it('preserves acknowledged delivery when all conversation history is pruned', () => {
    const session = new Session()
    session.append({ role: 'user', content: 'Escalate' })
    delivered(session)
    session.prune([])
    expect(session.messages).toEqual([])
    const restored = Session.fromJSON(JSON.parse(JSON.stringify(session)))
    expect(restored.lastSpeaker).toBe('assistant')
    restored.append([
      { role: 'summary', content: 'The request was escalated.' },
      { role: 'event', name: 'handoff', payload: {} },
    ])
    restored.beginTurn()
    expect(restored.lastSpeaker).toBe('assistant')
  })

  it.each<SessionInput>([
    { role: 'user', content: ' \n\t ' },
    { role: 'assistant', content: null },
    { role: 'assistant', type: 'multipart', content: [{ type: 'text', text: '  ' }] },
    { role: 'event', name: 'handoff', payload: {} },
    { role: 'summary', content: 'Earlier conversation.' },
  ])('ignores empty content and non-participant input: %j', (input) => {
    const session = new Session()
    session.append({ role: 'assistant', content: 'Already replied.' })
    session.append(input)
    session.beginTurn()
    expect(session.lastSpeaker).toBe('assistant')
  })

  it.each(['image', 'audio'] as const)('counts a user %s without text as a new message', (type) => {
    const session = new Session()
    session.append([
      { role: 'assistant', content: 'Already replied.' },
      { role: 'user', type: 'multipart', content: [{ type, url: 'https://example.com/media' }] },
    ])
    session.beginTurn()
    expect(session.lastSpeaker).toBe('user')
  })

  it('does not mistake generated text or runtime feedback for delivered speech', () => {
    const session = new Session()
    session.append({ role: 'user', content: 'Please reply.' })
    const { id } = session.nextIteration()
    session.appendAssistant(id, { output: 'Not delivered yet.' })
    expect(session.lastSpeaker).toBe('user')
    session.recordAssistantDelivery(id)
    session.appendContext('Runtime feedback, not user speech.')
    expect(session.lastSpeaker).toBe('assistant')
  })

  it('rejects delivery acknowledgments for settled or unknown iterations', () => {
    const session = new Session()
    expect(() => session.recordAssistantDelivery('missing')).toThrow('Unknown or settled iteration')
    expect(session.lastSpeaker).toBeNull()
  })

  it('restores older snapshots conservatively when delivery is unknown', () => {
    const session = new Session()
    delivered(session)
    const snapshot = session.toJSON()
    delete snapshot.lastSpeaker
    expect(Session.fromJSON(snapshot).lastSpeaker).toBeNull()
  })

  it.each(['system', 'tool', false, 42, {}])('rejects an invalid persisted speaker: %j', (lastSpeaker) => {
    const snapshot = new Session().toJSON()
    Object.assign(snapshot, { lastSpeaker })
    expect(() => Session.fromJSON(snapshot)).toThrow(InvalidSessionError)
  })
})
