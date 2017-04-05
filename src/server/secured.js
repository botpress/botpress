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

  app.get('/api/modules', (req, res) => {
    const modules = _.map(bp._loadedModules, (module) => {
      return {
        name: module.name,
        homepage: module.homepage,
        menuText: module.settings.menuText || module.name,
        menuIcon: module.settings.menuIcon || 'view_module',
        noInterface: !!module.settings.noInterface
      }
    })
    res.send(modules)
  })

  app.get('/api/middlewares', (req, res) => {
    res.send(bp.middlewares.list())
  })

  app.post('/api/middlewares/customizations', (req, res) => {
    bp.stats.track('api', 'middlewares', 'customizations')
    const { middlewares } = req.body
    bp.middlewares.setCustomizations(middlewares)
    bp.middlewares.load()
    res.send(bp.middlewares.list())
  })

  app.delete('/api/middlewares/customizations', (req, res) => {
    bp.stats.track('api', 'middlewares', 'customizations')
    bp.middlewares.resetCustomizations()
    bp.middlewares.load()
    res.send(bp.middlewares.list())
  })

  app.get('/api/notifications', (req, res) => {
    res.send(bp.notifications.load())
  })

  app.get('/api/bot/information', (req, res) => {
    res.send(bp.about.getBotInformation())
  })

  app.get('/api/module/all', (req, res) => {
    bp.modules.listAllCommunityModules()
    .then(modules => res.send(modules))
  })

  app.get('/api/module/popular', (req, res) => {
    bp.modules.listPopularCommunityModules()
    .then(popular => res.send(popular))
  })

  app.get('/api/module/featured', (req, res) => {
    bp.modules.listFeaturedCommunityModules()
    .then(featured => res.send(featured))
  })

  app.get('/api/module/hero', (req, res) => {
    bp.modules.getRandomCommunityHero()
    .then(hero => res.send(hero))
  })

  app.get('/api/bot/information', (req, res) => {
    res.send(bp.bot.getInformation())
  })

  app.get('/api/bot/production', (req, res) => {
    res.send(!util.isDeveloping)
  })

  app.get('/api/bot/contributor', (req, res) => {
    res.send(bp.bot.getContributor())
  })

  app.get('/api/license', (req, res) => {
    res.send(bp.licensing.getLicenses())
  })

  app.post('/api/license', (req, res) => {
    bp.stats.track('api', 'license', 'change')
    bp.licensing.changeLicense(req.body.license)
    .then(() => {
      res.sendStatus(200)
    })
    .catch(err => res.status(500).send({
      message: err && err.message
    }))
  })

  app.post('/api/module/install/:name', (req, res) => {
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

  app.delete('/api/module/uninstall/:name', (req, res) => {
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

  app.get('/api/logs', (req, res) => {
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

  app.get('/api/logs/key', (req, res) => {
    res.send({ secret: logsSecret })
  })

  app.get('/logs/archive/:key', (req, res) => {
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

  const apis = ExtraApiProviders(bp, app)
  apis.secured.map(x => x()) // Install all secured APIs
}
