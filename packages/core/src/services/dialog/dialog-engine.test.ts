import { BotpressEvent } from 'botpress-module-sdk'
import 'reflect-metadata'

import { DialogSession } from '../../repositories/session-repository'

import { NewDialogEngine } from './dialog-engine'

const SESSION_ID = 'some_user_id'

export function createSpyObj(baseName, methodNames) {
  const obj: any = {}

  for (let i = 0; i < methodNames.length; i++) {
    obj[methodNames[i]] = jest.fn()
  }
  return obj
}

describe('DialogEngine', () => {
  const flowService = createSpyObj('FlowService', ['loadAll'])
  const sessionService = createSpyObj('SessionService', ['createSession', 'getSession'])
  const event = stubEvent()

  let dialogEngine: NewDialogEngine

  beforeEach(() => {
    mockLoadFlow()
    mockGetSession()
    dialogEngine = new NewDialogEngine(flowService, sessionService)
  })

  it('should load all flows', () => {
    dialogEngine.processMessage(SESSION_ID, event)

    expect(flowService.loadAll).toHaveBeenCalled()
  })

  it('should get an existing session', () => {
    dialogEngine.processMessage(SESSION_ID, event)

    expect(sessionService.getSession).toHaveBeenCalledWith(SESSION_ID)
  })

  it('should create a session', () => {
    sessionService.getSession.mockReturnValue(undefined)
    dialogEngine = new NewDialogEngine(flowService, sessionService)

    dialogEngine.processMessage(SESSION_ID, event)

    expect(sessionService.createSession).toHaveBeenCalled()
  })

  function mockGetSession() {
    const session: DialogSession = {
      id: SESSION_ID,
      state: '',
      context: {
        currentFlow: {
          onEnter: jest.fn()
        }
      },
      event: ''
    }
    sessionService.getSession.mockReturnValue(session)
  }

  function mockLoadFlow() {
    const flow = {
      name: 'main.flow.json',
      node: { name: 'entry' }
    }
    flowService.loadAll.mockReturnValue([flow])
  }

  function stubEvent(): BotpressEvent {
    const event: BotpressEvent = {
      type: 'something',
      channel: 'asd',
      target: '',
      direction: 'incoming'
    }
    return event
  }
})
