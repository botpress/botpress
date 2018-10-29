import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'

import api from './api'
import { QnaStorage, SDK } from './qna'
import { initBot, initModule } from './setup'

const botScopedStorage: Map<string, QnaStorage> = new Map<string, QnaStorage>()

const onServerStarted = async (bp: SDK) => {
  await initModule(bp, botScopedStorage)
}

const onServerReady = async (bp: SDK) => {
  await api(bp, botScopedStorage)
}

const onBotMount = async (bp: SDK, botId: string) => {
  await initBot(bp, botScopedStorage, botId)
}

const onBotUnmount = async (bp: SDK, botId: string) => {
  botScopedStorage.delete(botId)
}

const serveFile = async (filePath: string): Promise<Buffer> => {
  filePath = filePath.toLowerCase()

  const mapping = {
    'index.js': path.join(__dirname, '../web/web.bundle.js')
  }

  // Web views
  if (mapping[filePath]) {
    return fs.readFileSync(mapping[filePath])
  }

  return Buffer.from('')
}

const config: sdk.ModuleConfig = {
  qnaDir: { type: 'string', required: true, default: './qna', env: 'QNA_DIR' },
  textRenderer: { type: 'string', required: true, default: '#builtin_text', env: 'QNA_TEXT_RENDERER' },
  exportCsvEncoding: { type: 'string', required: false, default: 'utf8', env: 'QNA_EXPORT_CSV_ENCODING' },
  qnaMakerApiKey: { type: 'string', required: false, default: '', env: 'QNA_MAKER_API_KEY' },
  qnaMakerKnowledgebase: { type: 'string', required: false, default: 'botpress', env: 'QNA_MAKER_KNOWLEDGEBASE' },
  qnaCategories: { type: 'string', required: false, default: '', env: 'QNA_CATEGORIES' }
}

const defaultConfigJson = `
{
  "qnaDir": "./qna",
  "textRenderer": "#builtin_text"
}`

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  config,
  defaultConfigJson,
  serveFile,
  definition: {
    name: 'qna',
    menuIcon: 'question_answer',
    menuText: 'Q&A',
    fullName: 'QNA',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint
