import axios from 'axios'
import * as sdk from 'botpress/sdk'
import { asyncMiddleware as asyncMw, BPRequest } from 'common/http'
import { Response } from 'express'
import fs from 'fs'
import path from 'path'

import { packageJsonPath } from '.'
import { packageLibrary } from './packager'
import { copyFileLocally, executeNpm, publishPackageChanges, removeLibrary } from './utils'

export default async (bp: typeof sdk) => {
  const asyncMiddleware = asyncMw(bp.logger)
  const router = bp.http.createRouterForBot('libraries')

  router.get(
    '/list',
    asyncMiddleware(async (req: any, res: any) => {
      // const packageJson = await
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
        // Since we rely on the code-editor for uploading the archive, the file needs to be copied on the file system before installing
        await copyFileLocally(path.basename(uploaded), bp)
      }

      const result = await executeNpm(['install', name])
      bp.logger.forBot(req.params.botId).info(`Installing library ${name}\n ${result}`)

      if (result.indexOf('ERR!') === -1) {
        await publishPackageChanges(bp)

        res.sendStatus(200)
      } else {
        res.sendStatus(400)
      }
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
