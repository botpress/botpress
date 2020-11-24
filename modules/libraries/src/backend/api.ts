import axios from 'axios'
import * as sdk from 'botpress/sdk'
import { BPRequest } from 'common/http'
import { Response } from 'express'
import fs from 'fs'

import { packageJsonPath } from '.'
import { executeNpm, packageLibrary, publishPackageChanges, removeLibrary } from './utils'

export default async (bp: typeof sdk) => {
  const router = bp.http.createRouterForBot('libraries', { checkAuthentication: false, enableJsonBodyParser: true })

  router.get('/list', async (req: any, res: any) => {
    const { dependencies } = JSON.parse(fs.readFileSync(packageJsonPath, 'UTF-8').toString())
    res.send(dependencies)
  })

  router.post('/package', async (req: any, res: any) => {
    const { name, version } = req.body

    const archive = await packageLibrary(name, version)

    res.writeHead(200, {
      'Content-Type': 'application/tar+gzip',
      'Content-Disposition': 'attachment; filename=archive.tgz',
      'Content-Length': archive.length
    })

    res.end(archive)
  })

  router.get('/search/:name', async (req: any, res: any) => {
    const { data } = await axios.get(`https://www.npmjs.com/search/suggestions?q=${req.params.name}`)

    res.send(data)
  })

  router.post('/add', async (req: any, res: any) => {
    const { name, uploaded } = req.body

    // Archive was just uploaded, ensure it has been copied locally before installing
    // TODO handle correctly
    if (uploaded) {
      await Promise.delay(1000)
    }

    const result = await executeNpm(['install', name])

    await publishPackageChanges(bp)

    res.send(result)
  })

  router.post('/delete', async (req: BPRequest, res: Response) => {
    const { name } = req.body

    await removeLibrary(name)
    const result = await executeNpm()

    await publishPackageChanges(bp)
    res.send(result)
  })
}
