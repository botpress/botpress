import axios from 'axios'
import * as sdk from 'botpress/sdk'
import { asyncMiddleware as asyncMw, BPRequest } from 'common/http'
import { Response } from 'express'
import fs from 'fs'
import path from 'path'

import { packageJsonPath } from '.'
import { copyFileLocally, executeNpm, packageLibrary, publishPackageChanges, removeLibrary } from './utils'

export default async (bp: typeof sdk) => {
  const asyncMiddleware = asyncMw(bp.logger)
  const router = bp.http.createRouterForBot('libraries', { checkAuthentication: false, enableJsonBodyParser: true })

  router.get(
    '/list',
    asyncMiddleware(async (req: any, res: any) => {
      const { dependencies } = JSON.parse(fs.readFileSync(packageJsonPath, 'UTF-8').toString())
      res.send(dependencies)
    })
  )

  router.post(
    '/package',
    asyncMiddleware(async (req: any, res: any) => {
      const { name, version } = req.body
      const archive = await packageLibrary(name, version)

      res.writeHead(200, {
        'Content-Type': 'application/tar+gzip',
        'Content-Disposition': 'attachment; filename=archive.tgz',
        'Content-Length': archive.length
      })

      res.end(archive)
    })
  )

  router.get(
    '/search/:name',
    asyncMiddleware(async (req: any, res: any) => {
      const { data } = await axios.get(`https://www.npmjs.com/search/suggestions?q=${req.params.name}`)
      res.send(data)
    })
  )

  router.get(
    '/details/:name',
    asyncMiddleware(async (req: any, res: any) => {
      const { data } = await axios.get(`https://registry.npmjs.org/${req.params.name}`, {
        headers: {
          accept: 'application/vnd.npm.install-v1+json'
        }
      })

      res.send(data)
    })
  )

  router.post(
    '/add',
    asyncMiddleware(async (req: any, res: any) => {
      const { name, uploaded } = req.body

      if (uploaded) {
        await copyFileLocally(path.basename(uploaded), bp)
      }

      const result = await executeNpm(['install', name])
      bp.logger.forBot(req.params.botId).info(`Installing library ${name}\n ${result}`)

      await publishPackageChanges(bp)

      res.sendStatus(200)
    })
  )

  router.post(
    '/delete',
    asyncMiddleware(async (req: BPRequest, res: Response) => {
      const { name } = req.body

      await removeLibrary(name, bp)

      const result = await executeNpm()
      bp.logger.forBot(req.params.botId).info(`Removing library ${name}\n ${result}`)

      await publishPackageChanges(bp)
      res.sendStatus(200)
    })
  )
}
