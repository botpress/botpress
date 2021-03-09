import * as sdk from 'botpress/sdk'
import { asyncMiddleware as asyncMw } from 'common/http'
import { Request, Response } from 'express'

import { SpellChecker } from './spellchecker'

export default async (bp: typeof sdk, spellcheckers: { [lang: string]: SpellChecker }) => {
  const asyncMiddleware = asyncMw(bp.logger)
  const router = bp.http.createRouterForBot('spellchecker')

  router.get(
    '/correct',
    asyncMiddleware(async (req: Request, res: Response) => {
      const lang = (await sdk.bots.getBotById(req.params.botId)).languages[0] || req.params.lang
      const correction = await spellcheckers[lang].correct(req.body.sentence)
      res.send(correction)
    })
  )

  router.get(
    '/isCorrect',
    asyncMiddleware(async (req: Request, res: Response) => {
      const lang = (await sdk.bots.getBotById(req.params.botId)).languages[0] || req.params.lang
      const isCorrect = await spellcheckers[lang].isCorrect(req.body.sentence)
      res.send(isCorrect)
    })
  )

  router.post(
    '/suggest',
    asyncMiddleware(async (req: Request, res: Response) => {
      const lang = (await sdk.bots.getBotById(req.params.botId)).languages[0] || req.params.lang
      const correction = await spellcheckers[lang].correct(req.body.sentence)
      res.send(correction)
    })
  )

  router.get(
    '/wordCorrect',
    asyncMiddleware(async (req: Request, res: Response) => {
      const lang = (await sdk.bots.getBotById(req.params.botId)).languages[0] || req.params.lang
      res.send(spellcheckers[lang].correctWord(req.body.word))
    })
  )

  router.get(
    '/isWordCorrect',
    asyncMiddleware(async (req: Request, res: Response) => {
      const lang = (await sdk.bots.getBotById(req.params.botId)).languages[0] || req.params.lang
      res.send(spellcheckers[lang].isWordCorrect(req.body.word))
    })
  )

  router.post(
    '/wordSuggest',
    asyncMiddleware(async (req: Request, res: Response) => {
      const lang = (await sdk.bots.getBotById(req.params.botId)).languages[0] || req.params.lang
      res.send(spellcheckers[lang].suggestWord(req.body.word))
    })
  )
}
