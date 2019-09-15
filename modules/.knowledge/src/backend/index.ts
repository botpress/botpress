import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import api from './api'
import { DocumentClassifier } from './classifier'
import { Indexer } from './indexer'
import { registerMiddleware } from './middleware'
import { ClassifierByBot, IndexerByBot } from './typings'

const indexers: IndexerByBot = {}
const classifiers: ClassifierByBot = {}

const onServerStarted = async (bp: typeof sdk) => {
  Indexer.ghostProvider = bp.ghost.forBot
  DocumentClassifier.ghostProvider = bp.ghost.forBot

  await registerMiddleware(bp, classifiers)
}

const onServerReady = async (bp: typeof sdk) => {
  await api(bp, indexers, classifiers)
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  classifiers[botId] = new DocumentClassifier(botId)
  indexers[botId] = new Indexer(botId, classifiers[botId], bp.logger)
  await classifiers[botId].loadMostRecent()
}

const onBotUnmount = async (bp: typeof sdk, botId: string) => {
  delete indexers[botId]
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  definition: {
    name: 'knowledge',
    menuIcon: 'library_books',
    menuText: 'Knowledge',
    fullName: 'knowledge',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint
