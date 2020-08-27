import * as sdk from 'botpress/sdk'
import { Request, Response } from 'express'
import moment from 'moment'
import multer from 'multer'
import nanoid from 'nanoid'

import { ScopedBots } from './qna'
import { getQnaEntryPayloads } from './utils'

export interface ImportArgs {
  topicName: string
  botId: string
  zipFile: Buffer
}

export default async (bp: typeof sdk, bots: ScopedBots) => {
  const router = bp.http.createRouterForBot('qna')
  const jsonRequestStatuses = {}
  router.get('/:topicName/questions', async (req: Request, res: Response) => {
    try {
      const { storage } = bots[req.params.botId]
      const items = await storage.fetchItems(req.params.topicName)
      const searchTerm = req.query.question.toLowerCase()
      const filteredItems = items.filter(qna => {
        // @ts-ignore
        const questions = Object.values(qna.questions).flat().map(q => q.toLowerCase())
        // @ts-ignore
        const answers = Object.values(qna.answers).flat().map(q => q.toLowerCase())
        return [...questions, ...answers].filter(q => q.includes(searchTerm)).length > 0
      }
      )

      const data = { count: items.length, items: filteredItems }
      res.send(data)
    } catch (e) {
      bp.logger.attachError(e).error('Error listing questions')
      res.status(500).send(e.message || 'Error')
    }
  })

  router.post('/:topicName/questions', async (req: Request, res: Response, next: Function) => {
    try {
      const { storage } = bots[req.params.botId]
      const id = await storage.updateSingleItem(req.params.topicName, req.body)
      res.send(id)
    } catch (e) {
      next(new Error(e.message))
    }
  })

  router.get('/:topicName/questions/:id', async (req: Request, res: Response) => {
    try {
      const { storage } = bots[req.params.botId]
      const items = await storage.fetchItems(req.params.topicName)
      const item = items.find(x => x.id === req.params.id)
      if (!item) {
        throw new Error(`QnA "${req.params.id}" Not found`)
      }
      res.send(item)
    } catch (e) {
      sendToastError('Fetch', e.message)
    }
  })

  router.post('/:topicName/questions/:id', async (req: Request, res: Response, next: Function) => {
    try {
      const { storage } = bots[req.params.botId]
      await storage.updateSingleItem(req.params.topicName, { ...req.body, id: req.params.id })
      const items = await storage.fetchItems(req.params.topicName)
      res.send({ items })
    } catch (e) {
      bp.logger.attachError(e).error(`Error updating QnA #${req.params.id}`)
      res.status(500).send(e.message || 'Error')
      sendToastError('Update', e.message)
    }
  })

  router.post('/:topicName/questions/:id/delete', async (req: Request, res: Response) => {
    try {
      const { storage } = bots[req.params.botId]
      await storage.deleteSingleItem(req.params.topicName, req.params.id)
      const items = await storage.fetchItems(req.params.topicName)
      res.send(items)
    } catch (e) {
      bp.logger.attachError(e).error(`Could not delete QnA #${req.params.id}`)
      res.status(500).send(e.message || 'Error')
      sendToastError('Delete', e.message)
    }
  })

  router.post('/:topicName/actions/:id', async (req: Request, res: Response) => {
    try {
      const { storage } = bots[req.params.botId]
      const items = await storage.fetchItems(req.params.topicName)
      const item = items.find(x => (x.id === req.params.id))
      const payloads = await getQnaEntryPayloads(item, req.body.userLanguage, bots[req.params.botId].defaultLang)
      res.send([
        {
          action: 'send',
          data: { payloads, source: 'qna', sourceDetails: `${req.params.topicName}/${req.params.id}` }
        }
      ])
    } catch (err) {
      bp.logger.attachError(err).error(err.message)
      res.status(200).send([])
    }
  })

  router.get('/:topicName/export', async (req: Request, res: Response) => {
    try {
      const { storage } = bots[req.params.botId]
      res.setHeader('Content-Type', 'application/gzip')
      res.setHeader('Content-disposition', `attachment; filename=qna_${req.params.topicName}_${moment().format('DD-MM-YYYY')}.tar.gz`)
      const zipBuffer = await storage.exportPerTopic(req.params.topicName)
      res.send(zipBuffer)
    } catch (e) {
      bp.logger.attachError(e).error('Zip export failure')
      res.status(500).send(e.message || 'Error')
    }

  })

  router.post('/:topicName/import', multer().single('file'), async (req: any, res: Response) => {
    const statusId = nanoid()
    jsonRequestStatuses[statusId] = 'module.qna.import.uploading'
    res.send(statusId)

    const { storage } = bots[req.params.botId]
    try {
      const importArgs: ImportArgs = {
        topicName: req.params.topicName,
        botId: req.params.botId,
        zipFile: req.file.buffer
      }
      await storage.importPerTopic(importArgs)
      jsonRequestStatuses[statusId] = 'module.qna.import.uploadSuccessful'
    } catch (e) {
      bp.logger.attachError(e).error('JSON Import Failure')
      jsonRequestStatuses[statusId] = `Error: ${e.message}`
    }
  })

  router.get('/questionsByTopic', async (req: Request, res: Response) => {
    try {
      const { storage } = bots[req.params.botId]
      res.send(await storage.getCountPerTopic())

    } catch (err) {
      bp.logger.attachError(err).error(err.message)
      res.status(200).send([])
    }
  })

  router.get('/json-upload-status/:uploadStatusId', async (req: Request, res: Response) => {
    res.send(jsonRequestStatuses[req.params.uploadStatusId])
  })

  const sendToastError = (action: string, error: string) => {
    bp.realtime.sendPayload(
      bp.RealTimePayload.forAdmins('toast.qna-save', { text: `QnA ${action} Error: ${error}`, type: 'error' })
    )
  }
}
