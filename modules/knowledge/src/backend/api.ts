import * as sdk from 'botpress/sdk'
import multer from 'multer'

import { IndexerByBot } from './typings'

export default async (bp: typeof sdk, indexers: IndexerByBot) => {
  const KNOWLEDGE_FOLDER = 'knowledge'
  const router = bp.http.createRouterForBot('knowledge')

  router.get('/list', async (req, res) => {
    try {
      const docs = await bp.ghost.forBot(req.params.botId).directoryListing(KNOWLEDGE_FOLDER, '*.*')
      res.send(docs)
    } catch (err) {
      res.status(500).send(err.message || 'Error while listing files')
    }
  })

  router.get('/sync', async (req, res) => {
    try {
      await indexers[req.params.botId].forceSync()
      res.sendStatus(200)
    } catch (err) {
      res.status(500).send(err.message || 'Error while syncing')
    }
  })

  router.get('/lastSync', async (req, res) => {
    res.sendStatus(200)
  })

  router.get('/view/:doc', async (req, res) => {
    try {
      const doc = await bp.ghost.forBot(req.params.botId).readFileAsBuffer(KNOWLEDGE_FOLDER, req.params.doc)

      res.setHeader('Content-Type', 'application/octet-stream')
      res.setHeader('Content-disposition', `attachment; filename=${req.params.doc}`)
      res.status(200).end(doc)
    } catch (err) {
      res.status(400).send(err)
    }
  })

  router.get('/delete/:doc', async (req, res) => {
    try {
      await bp.ghost.forBot(req.params.botId).deleteFile(KNOWLEDGE_FOLDER, req.params.doc)
      await indexers[req.params.botId].forceSync()

      res.sendStatus(200)
    } catch (err) {
      res.status(400).send(err)
    }
  })

  const upload = multer()
  router.post('/upload', upload.array('file'), async (req, res) => {
    try {
      for (const file of req.files) {
        await bp.ghost.forBot(req.params.botId).upsertFile(KNOWLEDGE_FOLDER, file.originalname, file.buffer)
      }

      await indexers[req.params.botId].forceSync()
      res.sendStatus(200)
    } catch (err) {
      res.status(400).send(err)
    }
  })
}
