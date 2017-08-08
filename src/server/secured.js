import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import uuid from 'uuid'

import util from '../util'
import ExtraApiProviders from '+/api'

let logsSecret = uuid.v4()

module.exports = (bp, app) => {

  app.get('/api/ping', (req, res) => {
    res.send('pong')
  })

  app.secure('read', 'modules/list')
  .get('/api/modules', (req, res) => {
    const modules = _.map(bp._loadedModules, (module) => {
      return {
        name: module.name,
        homepage: module.homepage,
        menuText: module.settings.menuText || module.name,
        menuIcon: module.settings.menuIcon || 'view_module',
        noInterface: !!module.settings.noInterface,
        plugins: module.settings.plugins || []
      }
    })
    res.send(modules)
  })

  app.secure('read', 'middleware/list')
  .get('/api/middlewares', (req, res) => {
    res.send(bp.middlewares.list())
  })

  app.secure('write', 'middleware/customizations')
  .post('/api/middlewares/customizations', (req, res) => {
    bp.stats.track('api', 'middlewares', 'customizations')
    const { middlewares } = req.body
    bp.middlewares.setCustomizations(middlewares)
    bp.middlewares.load()
    res.send(bp.middlewares.list())
  })

  app.secure('write', 'middleware/customizations')
  .delete('/api/middlewares/customizations', (req, res) => {
    bp.stats.track('api', 'middlewares', 'customizations')
    bp.middlewares.resetCustomizations()
    bp.middlewares.load()
    res.send(bp.middlewares.list())
  })

  app.secure('read', 'notifications')
  .get('/api/notifications', (req, res) => {
    res.send(bp.notifications.load())
  })

  app.secure('read', 'bot/information')
  .get('/api/bot/information', (req, res) => {
    res.send(bp.about.getBotInformation())
  })

  app.secure('read', 'modules/list/community')
  .get('/api/module/all', (req, res) => {
    bp.modules.listAllCommunityModules()
    .then(modules => res.send(modules))
  })

  app.secure('read', 'modules/list/community')
  .get('/api/module/hero', (req, res) => {
    bp.modules.getRandomCommunityHero()
    .then(hero => res.send(hero))
  })

  app.get('/api/bot/production', (req, res) => {
    res.send(!util.isDeveloping)
  })

  app.secure('read', 'modules/list/community')
  .get('/api/bot/contributor', (req, res) => {
    res.send(bp.bot.getContributor())
  })

  app.get('/api/license', async (req, res) => {
    res.send(await bp.licensing.getLicensing())
  })

  app.secure('write', 'bot/information/license')
  .post('/api/license', (req, res) => {
    bp.stats.track('api', 'license', 'change')
    bp.licensing.changeLicense(req.body.license)
    .then(() => {
      res.sendStatus(200)
    })
    .catch(err => res.status(500).send({
      message: err && err.message
    }))
  })

  app.secure('write', 'modules/list/install')
  .post('/api/module/install/:name', (req, res) => {
    bp.stats.track('api', 'modules', 'install')
    const { name } = req.params
    bp.modules.install(name)
    .then(() => {
      res.sendStatus(200)
      bp.restart(1000)
    })
    .catch(err => res.status(500).send({
      message: err && err.message
    }))
  })

  app.secure('write', 'modules/list/uninstall')
  .delete('/api/module/uninstall/:name', (req, res) => {
    bp.stats.track('api', 'modules', 'uninstall')
    const { name } = req.params
    bp.modules.uninstall(name)
    .then(() => {
      res.sendStatus(200)
      bp.restart(1000)
    })
    .catch(err => res.status(500).send({
      message: err && err.message
    }))
  })

  app.delete('/api/guided-tour', (req, res) => {
    fs.unlink(path.join(bp.projectLocation, '.welcome'), () => {
      bp.isFirstRun = false
      res.sendStatus(200)
    })
  })

  app.secure('read', 'bot/logs')
  .get('/api/logs', (req, res) => {
    const options = {
      from: new Date() - 7 * 24 * 60 * 60 * 1000,
      until: new Date(),
      limit: (req.query && req.query.limit) || 50,
      start: 0,
      order: 'desc',
      fields: ['message', 'level', 'timestamp']
    }

    bp.logger.query(options, (err, results) => {
      if (err) { return console.log(err) }
      res.send(results.file)
    })
  })

  app.secure('read', 'bot/logs')
  .get('/api/logs/key', (req, res) => {
    res.send({ secret: logsSecret })
  })

  app.secure('read', 'bot/logs/archive')
  .get('/logs/archive/:key', (req, res) => {
    bp.stats.track('api', 'logs', 'archive')
    if (req.params.key !== logsSecret) {
      return res.sendStatus(403)
    }

    bp.logger.archiveToFile()
    .then((archivePath) => {
      logsSecret = uuid.v4()
      res.download(archivePath)
    })
  })

  app.secure('read', 'bot/umm/blocs')
  .get('/umm/blocs', (req, res) => {
    const content = bp.umm.getDocument()
    res.send({ content: content })
  })

  app.secure('read', 'bot/umm/templates')
  .get('/umm/templates', (req, res) => {
    res.send({ templates: bp.umm.getTemplates() })
  })

  app.secure('write', 'bot/umm/blocs')
  .post('/umm/blocs', (req, res) => {
    const { content } = (req.body || {})
    if (_.isNil(content)) {
      return res.status(400).send({ message: 'You need to specify the content' })
    }

    bp.umm.saveDocument(content)

    return res.sendStatus(200)
  })

  app.secure('write', 'bot/umm/simulation')
  .post('/umm/simulate', (req, res) => {
    try {
      const { context, content, outputPlatform, incomingEvent } = req.body
      const blocs = bp.umm.parse({ context, outputPlatform, markdown: content, incomingEvent })
      res.send(blocs)
    } catch (err) {
      res.status(400).send({ message: err.message })
    }
  })

  app.secure('read', 'bot/content')
  .get('/content/categories', (req, res) => {
    res.send([
      { id: 'trivia', title: 'Trivia Questions', count: '1080' },
      { id: 'promotions', title: 'Promotions', count: '153' }
    ])
  })

  app.secure('read', 'bot/content')
  .get('/content/categories/:id/schema', (req, res) => {
    res.send({
      json: require('./jsonData.json'),
      ui: require('./ui.json'),
      title: 'Trivia Questions',
      description: 'Create a new Trivia question with up to 5 potential answers.',
      ummBloc: '#name-of-bloc'
    })
  })

  app.secure('read', 'bot/content')
  .get('/content/categories/all/items', (req, res) => {
    res.send([
      {
        id: 'trivia-1984',
        categoryId: 'trivia',
        previewText: 'Who was the first president of the United States?',
        createdOn: new Date(),
        createdBy: 'admin'
      },
      {
        id: 'trivia-5335',
        categoryId: 'trivia',
        previewText: 'In what year did Michael Jackson died?',
        createdOn: new Date(),
        createdBy: 'admin'
      }
    ])
  })

  app.secure('read', 'bot/content')
  .get('/content/categories/:id/items', (req, res) => {
    res.send([
      { 
        id: 'trivia-1984',
        categoryId: 'trivia',
        previewText: 'Who was the first president of the United States?',
        createdOn: new Date(),
        createdBy: 'admin'
      }
    ])
  })

  app.secure('read', 'bot/content')
  .post('/content/categories/:id/items', (req, res) => {
    if (!req.body.formData) { return res.status(500).send("Missing the data") }
    res.sendStatus(200)
  })

  app.secure('read', 'bot/content')
  .post('/content/categories/:id/bulk_delete', (req, res) => {
    if (!_.isArray(req.body)) { return res.status(500).send("Body must be an array of ids") }
    res.sendStatus(200)
  })

  const apis = ExtraApiProviders(bp, app)
  apis.secured.map(x => x && x()) // Install all secured APIs
}
