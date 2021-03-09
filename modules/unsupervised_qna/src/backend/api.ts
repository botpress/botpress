import * as sdk from 'botpress/sdk'
import { Storage } from './storage'

const API = async (http: typeof sdk.http, logger: sdk.Logger, storagePerBot: { [botId: string]: Storage }) => {
  const router = http.createRouterForBot('unsupervised')

  router.post('/corpus', async (req, res) => {
    const { botId } = req.params
    const { corpus } = req.body
    await storagePerBot[botId].persistCorpus(corpus)
  })

  router.get('/corpus', async (req, res) => {
    const { botId } = req.params
    const corpus = await storagePerBot[botId].getCorpus()
    res.send(corpus)
  })
}
export default API
