import { BotpressEvent } from 'botpress-module-sdk'
import 'reflect-metadata'

import { createSpyObject } from '../../../misc/utils'

import { SessionService } from './service'

const SESSION_ID = 'session-id'
const EVENT: BotpressEvent = {
  type: 'any',
  target: 'any',
  direction: 'incoming',
  channel: 'any'
}
const fakeSession = { fake: 'fake' }

describe('Load a session', () => {
  const mockRepository = createSpyObject('insert', 'get')
  const sessionService = new SessionService(mockRepository)

  it('Get a session', async () => {
    givenSessionExists()
    const session = await sessionService.getOrCreateSession(SESSION_ID, EVENT, {}, {})

    expect(session).toEqual(fakeSession)
    expect(mockRepository.get).toHaveBeenCalled()
    expect(mockRepository.insert).not.toHaveBeenCalled()
  })

  it('Create a new session when it doesnt exists', async () => {
    givenSessionDoesntExists()
    const session = await sessionService.getOrCreateSession(SESSION_ID, EVENT, {}, {})

    expect(session).toEqual(fakeSession)
    expect(mockRepository.get).toHaveBeenCalled()
    expect(mockRepository.insert).toHaveBeenCalled()
  })

  function givenSessionExists() {
    mockRepository.get.mockReturnValue(fakeSession)
  }

  function givenSessionDoesntExists() {
    mockRepository.get.mockReturnValue(undefined)
    mockRepository.insert.mockReturnValue(fakeSession)
  }
})
