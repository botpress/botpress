import { BotpressEvent } from 'botpress-module-sdk'
import { validateFlowSchema } from 'botpress-xx/src/services/dialog/validator'
import { DESIGN_PARAM_TYPES } from 'inversify/dts/constants/metadata_keys'
import 'reflect-metadata'

import { DialogEngine } from './dialog-engine'
jest.mock('./flow-service')
jest.mock('./session-service')

const SESSION_ID = 'some_user_id'

export function createSpyObj(baseName, methodNames) {
  const obj: any = {}

  for (let i = 0; i < methodNames.length; i++) {
    obj[methodNames[i]] = jest.fn()
  }
  return obj
}

describe('DialogEngine', () => {
  let dialogEngine: DialogEngine
  const processor = createSpyObj('InstructionProcessor', ['process'])
  const sessionService = { getSession: jest.fn(), createSession: jest.fn() }
  const flowService = createSpyObj('FlowService', ['loadAll'])
  const logger = {}
  const event: BotpressEvent = {
    type: 'slack',
    target: 'something',
    channel: 'web',
    direction: 'incoming'
  }

  beforeEach(() => {
    // @ts-ignore: All dependencies are mocked
    dialogEngine = new DialogEngine(processor, flowService, sessionService, logger)
  })

  it('Should load flows', () => {
    dialogEngine.processMessage(SESSION_ID, event)

    expect(flowService.loadAll).toBeCalled()
  })

  it('Should not load flows when they are already loaded', () => {
    flowService.loadAll.mockReturnValue([
      {
        name: 'main.flow.json'
      }
    ])

    dialogEngine.processMessage(SESSION_ID, event)

    expect(flowService.loadAll).toBeCalled()
  })
})
