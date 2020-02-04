import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import api from './api'
import { initBot, initModule } from './setup'
import Storage from './storage'

const botScopedStorage: Map<string, Storage> = new Map<string, Storage>()

const onServerStarted = async (bp: typeof sdk) => {
  await initModule(bp, botScopedStorage)
}

const onServerReady = async (bp: typeof sdk) => {
  await api(bp, botScopedStorage)
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  await initBot(bp, botScopedStorage, botId)
}

const onBotUnmount = async (bp: typeof sdk, botId: string) => {
  botScopedStorage.delete(botId)
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.events.removeMiddleware('qna.incoming')
  bp.http.deleteRouterForBot('qna')
}

const onFlowChanged = async (bp: typeof sdk, botId: string, newFlow: sdk.Flow) => {
  const oldFlow = await bp.ghost.forBot(botId).readFileAsObject<sdk.Flow>('./flows', newFlow.location)
  const qnaStorage = botScopedStorage.get(botId)
  const questions = await qnaStorage.getQuestions({ question: '', categories: [] }, { limit: 0, offset: 0 })

  // Detect nodes that had their name changed
  for (const oldNode of oldFlow.nodes) {
    for (const newNode of newFlow.nodes) {
      // Update all questions that refer to the old node name
      if (oldNode.id === newNode.id && oldNode.name !== newNode.name) {
        const updatedItems = questions.items
          .filter(q => q.data.redirectFlow === newFlow.name && q.data.redirectNode === oldNode.name)
          .map(q => {
            q.data.redirectNode = newNode.name
            return q
          })

        for (const item of updatedItems) {
          await qnaStorage.update(item.data, item.id)
          bp.logger.debug(`References to node "${oldNode.name}" have been updated to "${newNode.name}"`)
        }
      }
    }
  }
}

const onFlowRenamed = async (bp: typeof sdk, botId: string, previousFlowName: string, newFlowName: string) => {
  const qnaStorage = botScopedStorage.get(botId)
  const questions = await qnaStorage.getQuestions({ question: '', categories: [] }, { limit: 0, offset: 0 })

  const updatedItems = questions.items
    .filter(q => q.data.redirectFlow === previousFlowName)
    .map(q => {
      q.data.redirectFlow = newFlowName
      return q
    })

  for (const item of updatedItems) {
    await qnaStorage.update(item.data, item.id)
    bp.logger.debug(`References to flow "${previousFlowName}" have been updated to "${newFlowName}"`)
  }
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  onFlowChanged,
  onFlowRenamed,
  definition: {
    name: 'qna',
    menuIcon: 'question_answer',
    menuText: 'Q&A',
    fullName: 'QNA',
    homepage: 'https://botpress.com'
  }
}

export default entryPoint
