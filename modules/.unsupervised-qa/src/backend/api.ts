import * as sdk from 'botpress/sdk'
import { ModuleStatus } from '../typings'
import { Storage } from './storage'

export const makeAPI = (
  http: typeof sdk.http,
  logger: sdk.Logger,
  storagePerBot: { [botId: string]: Storage },
  moduleStatus: ModuleStatus
) => {
  const router = http.createRouterForBot('unsupervised')

  router.post('/corpus', async (req, res) => {
    const { botId } = req.params
    let corpus: string = req.body.corpus
    corpus = corpus.replace(/'\n'/g, '')
    await storagePerBot[botId].persistCorpus(corpus)
    res.end()
  })

  router.get('/corpus', async (req, res) => {
    const { botId } = req.params
    const corpus = await storagePerBot[botId].getCorpus()
    res.json({ corpus })
  })

  router.get('/status', async (req, res) => {
    res.json(moduleStatus)
  })
}
