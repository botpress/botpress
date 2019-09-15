import * as sdk from 'botpress/sdk'
import multer from 'multer'

import { ClassifierByBot, IndexerByBot } from './typings'

export default async (bp: typeof sdk, indexers: IndexerByBot, classifiers: ClassifierByBot) => {
  const KNOWLEDGE_FOLDER = 'knowledge'
  const acceptedMimeTypes = ['text/plain', 'application/pdf']

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
      await indexers[req.params.botId].forceSync(true)
      res.sendStatus(200)
    } catch (err) {
      res.status(500).send(err.message || 'Error while syncing')
    }
  })

  router.get('/status', async (req, res) => {
    const lastModel = await classifiers[req.params.botId].getMostRecentModel()
    if (!lastModel) {
      return res.send({ acceptedMimeTypes })
    }

    return res.send({
      lastSyncTimestamp: lastModel.replace(/\D/g, ''),
      acceptedMimeTypes
    })
  })

  router.get('/query', async (req, res) => {
    try {
      if (req.query.q && req.query.q.length) {
        const result = await classifiers[req.params.botId].predict(req.query.q)
        res.send(result)
      } else {
        res.send([])
      }
    } catch (err) {
      res.status(400).send(err)
    }
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

  router.post('/bulk_delete', async (req, res) => {
    try {
      for (const file of req.body) {
        await bp.ghost.forBot(req.params.botId).deleteFile(KNOWLEDGE_FOLDER, file)
      }

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
