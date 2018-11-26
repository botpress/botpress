import * as sdk from 'botpress/sdk'
import { execFileSync } from 'child_process'
import _ from 'lodash'

import path from 'path'

import { SDK } from './knowledge'

const Fuse = require('fuse.js')
const glob = require('glob')
const chokidar = require('chokidar')

type IndexEntry = {
  content: string
  filePath: string
  page: number
  fileName: string
}

const readPdfAsText = async fullPath => {
  const args = [fullPath, '-']
  const result = execFileSync('/usr/bin/pdftotext', args, {
    encoding: 'utf8'
  })

  const pages = []
  let current = ''

  for (const c of result) {
    if (Buffer.from(c, 'utf8').toString('hex') == '0c') {
      pages.push(current)
      current = ''
    } else {
      current += c
    }
  }

  return pages
}

const indexByBot: { [botId: string]: IndexEntry[] } = {}

const onServerStarted = async (bp: SDK) => {
  bp.events.registerMiddleware({
    name: 'knowledge.incoming',
    direction: 'incoming',
    handler: async (event, next) => {
      if (event.type !== 'text') {
        next()
      }

      const options = {
        shouldSort: true,
        threshold: 0.6,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 10,
        keys: ['content']
      }

      const fuse = new Fuse(indexByBot[event.botId], options)
      const result = fuse.search(event.preview)
      event.files = result || []
      next()
    },
    order: 15,
    description: 'Finds content from Knowledge base files',
    enabled: true
  })
}

const onServerReady = async (bp: SDK) => {}

const onBotMount = async (bp: SDK, botId: string) => {
  const dir = path.join((process as any).PROJECT_LOCATION, 'data/bots/', botId, 'knowledge')
  const watcher = chokidar.watch('**/*.pdf', {
    ignored: /(^|[\/\\])\../,
    cwd: dir,
    persistent: true
  })

  indexByBot[botId] = []

  const indexFile = async name => {
    const filePath = path.join(dir, name)
    const pages: string[] = await readPdfAsText(filePath)
    for (let i = 0; i <= pages.length; i++) {
      indexByBot[botId].push({
        page: i + 1,
        content: pages[i],
        filePath,
        fileName: name
      })
    }
  }

  const removeFile = name => {
    if (!indexByBot[botId]) {
      return
    }

    indexByBot[botId] = indexByBot[botId].filter(entry => {
      return entry.fileName !== name
    })
  }

  const files = glob.sync('**/*.pdf', { cwd: dir })

  files.forEach(f => indexFile(f))

  watcher
    .on('add', path => {
      removeFile(path)
      indexFile(path)
      bp.logger.info(`File ${path} has been indexed`)
    })
    .on('change', path => {
      removeFile(path)
      indexFile(path)
      bp.logger.info(`File ${path} has been re-indexed`)
    })
    .on('unlink', path => {
      removeFile(path)
      bp.logger.info(`File ${path} has been removed`)
    })
}

const onBotUnmount = async (bp: SDK, botId: string) => {}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  definition: {
    name: 'knowledge',
    menuIcon: 'question_answer',
    menuText: 'Knowledge',
    fullName: 'knowledge',
    homepage: 'https://botpress.io',
    noInterface: true,
    plugins: [],
    moduleView: { stretched: true }
  }
}

export default entryPoint
