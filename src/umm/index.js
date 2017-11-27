import path from 'path'
import util from 'util'

import _ from 'lodash'
import Promise from 'bluebird'

import Engine from './engine'
import Proactive from './proactive'

const fs = Promise.promisifyAll(require('fs'))

module.exports = ({ logger, middlewares, botfile, projectLocation, db, contentManager }) => {
  const processors = {} // A map of all the platforms that can process outgoing messages
  const templates = {} // A map of all the platforms templates
  const storagePath = getStoragePath()

  const registerConnector = ({ platform, processOutgoing, templates }) => {
    // TODO throw if templates not array
    // TODO throw if platform not string
    // TODO throw if processOutgoing not a function
    // TODO throw if platform already registered

    logger.verbose(`[UMM] Enabled for ${platform}`) // TODO remove that

    processors[platform] = processOutgoing
    templates[platform] = templates
  }

  const parse = ({ context, outputPlatform, markdown = null, incomingEvent = null }) => {
    // TODO throw if context empty

    // TODO throw if markdown nil <<<==== Pick default markdown
    // TODO throw if incomingEvents null <<<==== MOCK IT

    const options = {
      throwIfNoPlatform: true,
      currentPlatform: outputPlatform
    }

    return Engine({ markdown, context, options, processors, incomingEvent })
  }

  const getTemplates = () => _.merge({}, templates) // Return a deep copy

  const getStoragePath = () => {
    const resolve = file => path.resolve(projectLocation, file)
    let ummPath = _.get(botfile, 'umm.contentPath')

    if (!ummPath) {
      const single = resolve('content.yml')
      const folder = resolve('content')

      if (fs.existsSync(single)) {
        ummPath = single
      } else if (fs.existsSync(folder)) {
        ummPath = folder
      } else {
        throw new Error('UMM content location not found')
      }
    }

    if (path.isAbsolute(ummPath)) {
      return ummPath
    } else {
      return path.resolve(projectLocation, ummPath)
    }
  }

  const saveDocument = content => {
    if (_.isObject(content)) {
      return Promise.map(Object.keys(content), fileName => {
        const filePath = path.join(storagePath, fileName + '.yml')
        return fs.writeFileAsync(filePath, content[fileName], 'utf8')
      })
    }

    return fs.writeFileAsync(storagePath, content, 'utf8')
  }

  const getDocument = async () => {
    const stats = await fs.statAsync(storagePath)

    if (stats.isDirectory()) {
      const files = await fs.readdirAsync(storagePath)
      const contents = {}

      files.forEach(file => {
        if (!file.endsWith('.yml')) {
          return
        }

        const filename = path.basename(file, path.extname(file))
        contents[filename] = fs.readFileAsync(path.join(storagePath, file), 'utf8')
      })

      return Promise.props(contents)
    }

    return fs.readFileAsync(storagePath, 'utf8')
  }

  const doSendBloc = bloc =>
    Promise.mapSeries(bloc, message => {
      if (message.__internal) {
        if (message.type === 'wait') {
          return Promise.delay(message.wait)
        }
      } else {
        return middlewares.sendOutgoing(message)
      }
    })

  const sendBloc = async (incomingEvent, blocName, additionalData = {}) => {
    blocName = blocName[0] === '#' ? blocName.substr(1) : blocName

    let initialData = {}

    if (blocName.startsWith('!')) {
      const itemName = blocName.substr(1)
      const contentItem = await contentManager.getItem(itemName)

      if (!contentItem) {
        throw new Error(`Could not find content item with ID "${itemName}" in the Content Manager`)
      }

      const { categoryId: itemCategoryId } = contentItem

      const itemCategory = await contentManager.getCategorySchema(itemCategoryId)

      if (!itemCategory) {
        throw new Error(
          `Could not find category "${itemCategoryId}" in the Content Manager` + ` for item with ID "${itemName}"`
        )
      }

      const itemBloc = itemCategory.ummBloc
      if (!_.isString(itemBloc) || !itemBloc.startsWith('#') || itemBloc.length <= 1) {
        throw new Error(`Invalid UMM bloc "${itemBloc}" in category ${itemCategoryId} of Content Manager`)
      }

      blocName = itemBloc.substr(1)
      initialData = Object.assign(initialData, contentItem.data)
    }

    const split = blocName.split('.')
    let fileName = null

    if (split.length === 2) {
      fileName = split[0]
      blocName = split[1]
    }

    let markdown = await getDocument()

    // TODO Add more context
    const fullContext = Object.assign(
      {},
      initialData,
      {
        user: incomingEvent.user,
        originalEvent: incomingEvent
      },
      additionalData
    )

    if (_.isObject(markdown)) {
      if (!fileName) {
        throw new Error(`Unknown UMM bloc filename: ${blocName}`)
      }

      if (!markdown[fileName]) {
        throw new Error(`UMM content ${fileName}.yml not found`)
      }

      markdown = markdown[fileName]
    }

    const blocs = parse({
      context: fullContext,
      outputPlatform: incomingEvent.platform,
      markdown: markdown,
      incomingEvent: incomingEvent
    })

    // TODO check if message OK and catch errors
    // TODO throw if bloc does not exist

    const bloc = blocs[blocName]

    if (_.isNil(bloc)) {
      const error = `[UMM] Bloc not defined (#${blocName})`
      logger.error(error)
      throw new Error(error)
    }

    return doSendBloc(bloc)
  }

  const processIncoming = (event, next) => {
    event.reply = (blocName, additionalData = {}) => {
      return sendBloc(event, blocName, additionalData)
    }

    next()
  }

  const incomingMiddleware = {
    name: 'UMM.instrumentation',
    type: 'incoming',
    order: 2, // Should really be first
    module: 'botpress',
    description: 'Built-in Botpress middleware that adds a `.reply` to events. Works with UMM.',
    handler: processIncoming
  }

  const proactiveMethods = Proactive({ sendBloc, db })

  return { registerConnector, parse, getTemplates, incomingMiddleware, getDocument, saveDocument, ...proactiveMethods }
}
