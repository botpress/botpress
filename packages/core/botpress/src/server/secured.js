import _ from 'lodash'
import nanoid from 'nanoid'
import multer from 'multer'

import util from '../util'

let logsSecret = nanoid()

module.exports = (bp, app) => {
  // modules

  app.secure('read', 'bot.modules.list').get('/api/modules', (req, res) => {
    const modules = _.map(bp._loadedModules, module => {
      return {
        name: util.getModuleShortname(module.name),
        fullName: module.name,
        homepage: module.homepage,
        isPlugin: module.settings.isPlugin,
        menuText: module.settings.menuText || module.name,
        menuIcon: module.settings.menuIcon || 'view_module',
        noInterface: !!module.settings.noInterface,
        moduleView: module.settings.moduleView || { stretched: false },
        plugins: module.settings.plugins || []
      }
    })
    res.send(modules)
  })

  app.secure('read', 'bot.modules.list.community').get('/api/module/all', (req, res) => {
    bp.modules.listAllCommunityModules().then(modules => res.send(modules))
  })

  app.secure('read', 'bot.modules.list.community').get('/api/module/hero', (req, res) => {
    bp.modules.getRandomCommunityHero().then(hero => res.send(hero))
  })

  app.secure('read', 'bot.modules.list.community').get('/api/bot/contributor', (req, res) => {
    res.send(bp.bot.getContributor())
  })

  // middleware

  app.secure('read', 'bot.middleware.list').get('/api/middlewares', (req, res) => {
    res.send(bp.middlewares.list())
  })

  app.secure('write', 'bot.middleware.customizations').post('/api/middlewares/customizations', (req, res) => {
    bp.stats.track('api', 'middlewares', 'customizations')
    const { middlewares } = req.body
    bp.middlewares.setCustomizations(middlewares)
    bp.middlewares.load()
    res.send(bp.middlewares.list())
  })

  app.secure('write', 'bot.middleware.customizations').delete('/api/middlewares/customizations', (req, res) => {
    bp.stats.track('api', 'middlewares', 'customizations')
    bp.middlewares.resetCustomizations()
    bp.middlewares.load()
    res.send(bp.middlewares.list())
  })

  // notifications

  // DEPRECATED in Botpress 1.1
  app.secure('read', 'bot.notifications').get('/api/notifications', async (req, res) => {
    res.send(await bp.notifications.getInbox())
  })

  app.secure('read', 'bot.notifications').get('/api/notifications/inbox', async (req, res) => {
    res.send(await bp.notifications.getInbox())
  })

  // bot

  app.secure('read', 'bot.information').get('/api/bot/information', (req, res) => {
    res.send(bp.about.getBotInformation())
  })

  app.secure('write', 'bot.information.license').post('/api/license', (req, res) => {
    bp.stats.track('api', 'license', 'change')
    bp.licensing
      .changeLicense(req.body.license)
      .then(() => {
        res.sendStatus(200)
      })
      .catch(err =>
        res.status(500).send({
          message: err && err.message
        })
      )
  })

  app.secure('read', 'bot.logs').get('/api/logs', (req, res) => {
    const options = {
      from: new Date() - 7 * 24 * 60 * 60 * 1000,
      until: new Date(),
      limit: (req.query && req.query.limit) || 50,
      start: 0,
      order: 'desc',
      fields: ['message', 'level', 'timestamp']
    }

    bp.logger.query(options, (err, results) => {
      if (err) {
        return console.log(err)
      }
      res.send(results.file)
    })
  })

  app.secure('read', 'bot.logs').get('/api/logs/key', (req, res) => {
    res.send({ secret: logsSecret })
  })

  app.secure('read', 'bot.logs.archive').get('/api/logs/archive/:key', (req, res) => {
    bp.stats.track('api', 'logs', 'archive')
    if (req.params.key !== logsSecret) {
      return res.sendStatus(403)
    }

    bp.logger.archiveToFile().then(archivePath => {
      logsSecret = nanoid()
      res.download(archivePath)
    })
  })

  app.secure('read', 'bot.content').get('/api/content/categories', async (req, res) => {
    res.send(await bp.contentManager.listAvailableCategories())
  })

  app.secure('read', 'bot.content').get('/api/content/items', async (req, res) => {
    const from = req.query.from || 0
    const count = req.query.count || 50
    let { searchTerm, categoryId, orderBy } = req.query

    if (categoryId === 'all') {
      categoryId = null
    }

    res.send(await bp.contentManager.listCategoryItems(categoryId, { from, count, searchTerm, orderBy }))
  })

  app.secure('read', 'bot.content').get('/api/content/items/count', async (req, res) => {
    let { categoryId } = req.query
    if (categoryId === 'all') {
      categoryId = null
    }
    res.send({ count: await bp.contentManager.categoryItemsCount(categoryId) })
  })

  app.secure('read', 'bot.content').get('/api/content/items/:id', async (req, res) => {
    res.send(await bp.contentManager.getItem(req.params.id))
  })

  app.secure('read', 'bot.content').get('/api/content/items-batched/:ids', async (req, res) => {
    res.send(await bp.contentManager.getItems(req.params.ids))
  })

  app.secure('write', 'bot.content').post('/api/content/categories/:id/items', async (req, res) => {
    res.send(
      await bp.contentManager.createOrUpdateCategoryItem({
        formData: req.body.formData,
        categoryId: req.params.id
      })
    )
  })

  app.secure('write', 'bot.content').post('/api/content/categories/:id/items/:itemId', async (req, res) => {
    await bp.contentManager.createOrUpdateCategoryItem({
      itemId: req.params.itemId,
      formData: req.body.formData,
      categoryId: req.params.id
    })
    res.sendStatus(200)
  })

  app.secure('write', 'bot.content').post('/api/content/categories/all/bulk_delete', async (req, res) => {
    await bp.contentManager.deleteCategoryItems(req.body)
    res.sendStatus(200)
  })

  app.secure('read', 'bot.ghost_content').get('/api/ghost_content/status', async (req, res) => {
    res.send(await bp.ghostManager.getPending())
  })

  app.secure('read', 'bot.ghost_content').get('/api/ghost_content/export', async (req, res) => {
    res.send(await bp.ghostManager.getPendingWithContent({ stringifyBinary: true }))
  })

  app.secure('write', 'bot.ghost_content').delete('/api/ghost_content/:folder', async (req, res) => {
    res.send(await bp.ghostManager.revertAllPendingChangesForFile(req.params.folder, req.query.file))
  })

  const mediaUploadMulter = multer({
    limits: {
      fileSize: 1024 * 1000 * 10 // 100mb
    }
  })

  app.secure('write', 'bot.media').post('/api/media', mediaUploadMulter.single('file'), async (req, res) => {
    const filename = await bp.mediaManager.saveFile(req.file.originalname, req.file.buffer)
    const url = `/media/${filename}`
    return res.json({ url })
  })

  app.secure('read', 'bot.flows').get('/api/flows/all', async (req, res) => {
    const flows = await bp.dialogEngine.getFlows()
    res.send(flows)
  })

  app.secure('read', 'bot.flows').get('/api/flows/available_actions', async (req, res) => {
    const actions = bp.dialogEngine.getAvailableActions()
    res.send(actions)
  })

  app.secure('write', 'bot.flows').post('/api/flows/save', async (req, res) => {
    await bp.dialogEngine.flowProvider.saveFlows(req.body)
    res.sendStatus(200)
  })

  app.secure('write', 'bot.skills').post('/api/skills/:skillId/generate', async (req, res) => {
    res.send(await bp.skills.generateFlow(req.params.skillId, req.body))
  })

  app.get('/api/community/hero', (req, res) => {
    res.send({ hidden: _.get(bp, 'botfile.heroSection.hidden', false) })
  })
}
