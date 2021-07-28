import { Request } from 'express-serve-static-core'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'

const debug = DEBUG('api')
const debugRequest = debug.sub('request')

export const debugRequestMw = (req: Request, _res, next) => {
  debugRequest(`${req.path} %o`, {
    method: req.method,
    ip: req.ip,
    originalUrl: req.originalUrl
  })

  next()
}

const indexCache: { [pageUrl: string]: string } = {}

// Dynamically updates the static paths of index files
export const resolveIndexPaths = (page: string) => (req, res) => {
  res.contentType('text/html')

  // Not caching pages in dev (issue with webpack )
  if (indexCache[page] && process.IS_PRODUCTION) {
    return res.send(indexCache[page])
  }

  fs.readFile(resolveAsset(page), (err, data) => {
    if (data) {
      indexCache[page] = data
        .toString()
        .replace(/\<base href=\"\/\" ?\/\>/, `<base href="${process.ROOT_PATH}/" />`)
        .replace(/ROOT_PATH=""|ROOT_PATH = ''/, `window.ROOT_PATH="${process.ROOT_PATH}"`)

      res.send(indexCache[page])
    } else {
      res.sendStatus(404)
    }
  })
}

export const resolveAsset = (file: string) => path.resolve(process.PROJECT_LOCATION, 'data/assets', file)
