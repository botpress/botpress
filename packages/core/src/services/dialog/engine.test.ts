import { BotpressEvent } from 'botpress-module-sdk'
import _ from 'lodash'
import 'reflect-metadata'

import { createSpyObject } from '../../misc/utils'
import { DialogSession } from '../../repositories/session-repository'

import { DialogEngine } from './engine'
import { InstructionQueue } from './instruction/queue'
import { context, flows } from './stubs'

describe('Dialog Engine', () => {
  const sessionService = createSpyObject('getSession', 'createSession', 'updateSession')
  const flowNavigator = createSpyObject('')
  const flowService = createSpyObject('loadAll', 'findDefaultFlow')
  const instructionProcessor = createSpyObject('process')
  const botId = 'bot123'
  const event = new BotpressEvent({ type: '', target: '', direction: 'incoming', channel: '', payload: '' })
  const session = stubSession()

  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('Process instructions', () => {
    it('Call the instruction processor', async () => {})

    it('Stop processing on wait', async () => {})

    it('Call the flow navigator on transit', async () => {})
  })
})
