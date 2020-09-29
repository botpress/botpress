import * as sdk from 'botpress/sdk'
import { asyncMiddleware as asyncMw } from 'common/http'
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
  const asyncMiddleware = asyncMw(bp.logger)
  const router = bp.http.createRouterForBot('qna')
  const jsonRequestStatuses = {}
  router.get(
    '/:topicName/questions',
    asyncMiddleware(async (req: Request, res: Response) => {
      const { storage } = bots[req.params.botId]
      const items = await storage.fetchItems(req.params.topicName)
      const searchTerm = (req.query.question || '').toLowerCase()
      const filteredItems = items.filter(qna => {
        const questions = Object.values(qna.questions)
          // @ts-ignore
          .flat()
          .map(q => q.toLowerCase())
        const answers = Object.values(qna.answers)
          // @ts-ignore
          .flat()
          .map(q => q.toLowerCase())
        return [...questions, ...answers].filter(q => q.includes(searchTerm)).length > 0
      })

      const data = { count: items.length, items: filteredItems }
      res.send(data)
    })
  )

  router.post(
    '/:topicName/questions',
    asyncMiddleware(async (req: Request, res: Response, next: Function) => {
      const { storage } = bots[req.params.botId]
      const id = await storage.updateSingleItem(req.params.topicName, req.body)
      res.send(id)
    })
  )

  router.post(
    '/:topicName/questions/move',
    asyncMiddleware(async (req: Request, res: Response, next: Function) => {
      const { storage } = bots[req.params.botId]
      await storage.moveToAnotherTopic(req.params.topicName, req.body.newTopic)
      res.sendStatus(200)
    })
  )

  router.get(
    '/:topicName/questions/:id',
    asyncMiddleware(async (req: Request, res: Response) => {
      const { storage } = bots[req.params.botId]
      const items = await storage.fetchItems(req.params.topicName)
      const item = items.find(x => x.id === req.params.id)
      if (!item) {
        throw new Error(`QnA "${req.params.id}" Not found`)
      }
      res.send(item)
    })
  )

  router.post(
    '/:topicName/questions/:id',
    asyncMiddleware(async (req: Request, res: Response, next: Function) => {
      const { storage } = bots[req.params.botId]
      await storage.updateSingleItem(req.params.topicName, { ...req.body, id: req.params.id })
      const items = await storage.fetchItems(req.params.topicName)
      res.send({ items })
    })
  )

  router.post(
    '/:topicName/questions/:id/delete',
    asyncMiddleware(async (req: Request, res: Response) => {
      const { storage } = bots[req.params.botId]
      await storage.deleteSingleItem(req.params.topicName, req.params.id)
      const items = await storage.fetchItems(req.params.topicName)
      res.send(items)
    })
  )

  router.post(
    '/:topicName/actions/:id',
    asyncMiddleware(async (req: Request, res: Response) => {
      const { storage } = bots[req.params.botId]
      const items = await storage.fetchItems(req.params.topicName)
      const item = items.find(x => x.id === req.params.id)
      const payloads = await getQnaEntryPayloads(item, req.body.userLanguage, bots[req.params.botId].defaultLang)
      res.send([
        {
          action: 'send',
          data: { payloads, source: 'qna', sourceDetails: `${req.params.topicName}/${req.params.id}` }
        }
      ])
    })
  )

  router.get(
    '/:topicName/export',
    asyncMiddleware(async (req: Request, res: Response) => {
      const { storage } = bots[req.params.botId]
      res.setHeader('Content-Type', 'application/gzip')
      res.setHeader(
        'Content-disposition',
        `attachment; filename=qna_${req.params.topicName}_${moment().format('DD-MM-YYYY')}.tar.gz`
      )
      const zipBuffer = await storage.exportPerTopic(req.params.topicName)
      res.send(zipBuffer)
    })
  )

  router.post(
    '/:topicName/import',
    multer().single('file'),
    asyncMiddleware(async (req: any, res: Response) => {
      const statusId = nanoid()
      jsonRequestStatuses[statusId] = 'module.qna.import.uploading'
      res.send(statusId)
      const { storage } = bots[req.params.botId]
      const importArgs: ImportArgs = {
        topicName: req.params.topicName,
        botId: req.params.botId,
        zipFile: req.file.buffer
      }
      try {
        await storage.importArchivePerTopic(importArgs)
        jsonRequestStatuses[statusId] = 'module.qna.import.uploadSuccessful'
      } catch (e) {
        jsonRequestStatuses[statusId] = `Error: ${e.message}`
      }
    })
  )

  router.get(
    '/questionsByTopic',
    asyncMiddleware(async (req: Request, res: Response) => {
      const { storage } = bots[req.params.botId]
      res.send(await storage.getCountPerTopic())
    })
  )

  router.get(
    '/json-upload-status/:uploadStatusId',
    asyncMiddleware(async (req: Request, res: Response) => {
      res.send(jsonRequestStatuses[req.params.uploadStatusId])
    })
  )
}
