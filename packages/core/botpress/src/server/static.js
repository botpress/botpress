import { static as staticMiddleware } from 'express'
import path from 'path'
import fs from 'fs'
import ms from 'ms'
import util from '../util'
import yn from 'yn'

module.exports = bp => {
  const serveModule = (app, module) => {
    const name = module.name
    const shortName = util.getModuleShortname(module.name)

    if (module.settings.menuIcon === 'custom') {
      const iconRequestPath = `/img/modules/${name}.png`
      const iconPath = path.join(module.root, 'icon.png')

      app.get(iconRequestPath, (req, res) => {
        try {
          res.contentType('image/png')
          res.sendFile(iconPath)
        } catch (err) {
          bp.logger.warn(`Could not serve module icon [${name}] at: ${iconPath}`)
        }
      })
    }

    const liteDir = path.join(module.root, module.settings.liteDir || 'bin/lite')

    app.get(
      [
        `/js/modules/${shortName}`, // The full module view
        `/js/modules/${name}.js`, // <<-- DEPRECATED: Will be removed shortly. Only use shortNames
        `/js/modules/${shortName}/:subview` // Lite view
      ],
      (req, res) => {
        const settingsKey = module.settings.webBundle
        const bundlePath =
          req.params && req.params.subview
            ? path.join(liteDir, req.params.subview + '.bundle.js') // Render lite view
            : path.join(module.root, settingsKey || 'bin/web.bundle.js')

        try {
          const content = fs.readFileSync(bundlePath)
          res.contentType('text/javascript')
          res.send(content)
        } catch (err) {
          bp.logger.warn(`Could not serve module [${name}] at: ${bundlePath}`)
          res.sendStatus(404)
        }
      }
    )
  }

  const serveCustomTheme = app => {
    let customTheme = ''

    if (bp.licensing.getFeatures().whitelabel === true) {
      const themeLocation = path.join(bp.projectLocation, 'theme.css')
      if (fs.existsSync(themeLocation)) {
        customTheme = fs.readFileSync(themeLocation)
      }
    }

    app.use('/style/custom-theme.css', (req, res) => {
      res.contentType('text/css')
      res.send(customTheme)
    })
  }

  const serveMedia = app => {
    app.get('/media/:filename', async (req, res) => {
      const contents = await bp.mediaManager.readFile(req.params.filename)
      if (!contents) {
        return res.sendStatus(404)
      }
      const type = path.extname(req.params.filename)
      // files are never overwritten because of the unique ID
      // so we can set the header to cache the asset for 1 year
      return res
        .set({ 'Cache-Control': 'max-age=31556926' })
        .type(type)
        .send(contents)
    })
  }

  const install = async app => {
    for (const name in bp._loadedModules) {
      const module = bp._loadedModules[name]
      serveModule(app, module)
    }

    app.use('/js/env.js', async (req, res) => {
      const { tokenExpiry, enabled: authEnabled, useCloud } = bp.botfile.login
      const { enabled: ghostEnabled } = bp.botfile.ghostContent
      const optOutStats = !!bp.botfile.optOutStats
      const appName = bp.botfile.appName || 'Botpress'

      const isUsingCloud = !!useCloud && (await bp.cloud.isPaired())
      const pairingInfo = { botId: '', endpoint: '', teamId: '', env: bp.botfile.env }
      if (isUsingCloud) {
        Object.assign(pairingInfo, await bp.cloud.getPairingInfo())
        delete pairingInfo.token
      }

      const { isFirstRun, version } = bp
      res.contentType('text/javascript')
      res.send(`(function(window) {
        window.NODE_ENV = "${process.env.NODE_ENV || 'development'}";
        window.BOTPRESS_ENV = "${bp.botfile.env}";
        window.BOTPRESS_CLOUD_ENABLED = ${isUsingCloud};
        window.BOTPRESS_CLOUD_SETTINGS = ${JSON.stringify(pairingInfo)};
        window.DEV_MODE = ${util.isDeveloping};
        window.AUTH_ENABLED = ${!!authEnabled};
        window.AUTH_TOKEN_DURATION = ${ms(tokenExpiry)};
        window.OPT_OUT_STATS = ${optOutStats};
        window.SHOW_GUIDED_TOUR = ${isFirstRun};
        window.BOTPRESS_VERSION = "${version}";
        window.APP_NAME = "${appName}";
        window.GHOST_ENABLED = ${!!ghostEnabled};
        window.BOTPRESS_FLOW_EDITOR_DISABLED = ${yn(process.env.BOTPRESS_FLOW_EDITOR_DISABLED)};
      })(typeof window != 'undefined' ? window : {})`)
    })

    serveCustomTheme(app)

    serveMedia(app)

    app.use(staticMiddleware(path.join(bp.projectLocation, 'static')))

    app.use(staticMiddleware(path.join(bp.botpressPath, './lib/web')))

    app.get('*', (req, res, next) => {
      // If browser requests HTML and request isn't an API request
      if (/html/i.test(req.headers.accept) && !/^\/api\//i.test(req.url)) {
        if (req.url && /^\/lite\//i.test(req.url)) {
          return res.sendFile(path.join(bp.botpressPath, './lib/web/lite/index.html'))
        }

        return res.sendFile(path.join(bp.botpressPath, './lib/web/index.html'))
      }
      next()
    })

    return true
  }

  return { install }
}
