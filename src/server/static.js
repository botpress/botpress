/* global BP_EDITION */

import Promise from 'bluebird'
import { static as staticMiddleware } from 'express'
import path from 'path'
import fs from 'fs'
import ms from 'ms'
import util from '../util'

module.exports = bp => {
  const serveModule = (app, module) => {
    const name = module.name
    const shortName = util.getModuleShortname(module.name)

    if (module.settings.menuIcon === 'custom') {
      const iconRequestPath = `/img/modules/${name}.png`
      const iconPath = path.join(module.root, 'icon.png')

      app.get(iconRequestPath, (req, res) => {
        try {
          const content = fs.readFileSync(iconPath)
          res.contentType('image/png')
          res.send(content)
        } catch (err) {
          bp.logger.warn(`Could not serve module icon [${name}] at: ${iconPath}`)
        }
      })
    }

    const liteDir = path.join(module.root, module.settings.liteDir || 'bin/lite')
    const liteViews = fs.existsSync(liteDir) ? fs.readdirSync(liteDir).filter(b => b.endsWith('.js')) : []

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

    if (BP_EDITION !== 'lite' && bp.licensing.getFeatures().whitelabel === true) {
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

  const install = async app => {
    for (const name in bp._loadedModules) {
      const module = bp._loadedModules[name]
      serveModule(app, module)
    }

    app.use('/js/env.js', (req, res) => {
      const { tokenExpiry, enabled: authEnabled } = bp.botfile.login
      const { enabled: ghostEnabled } = bp.botfile.ghostContent
      const optOutStats = !!bp.botfile.optOutStats
      const appName = bp.botfile.appName || 'Botpress'

      const { isFirstRun, version } = bp
      res.contentType('text/javascript')
      res.send(`(function(window) {
        window.NODE_ENV = "${process.env.NODE_ENV || 'development'}";
        window.DEV_MODE = ${util.isDeveloping};
        window.AUTH_ENABLED = ${!!authEnabled};
        window.AUTH_TOKEN_DURATION = ${ms(tokenExpiry)};
        window.OPT_OUT_STATS = ${optOutStats};
        window.SHOW_GUIDED_TOUR = ${isFirstRun};
        window.BOTPRESS_VERSION = "${version}";
        window.APP_NAME = "${appName}";
        window.GHOST_ENABLED = ${!!ghostEnabled};
      })(typeof window != 'undefined' ? window : {})`)
    })

    serveCustomTheme(app)

    app.use(staticMiddleware(path.join(bp.projectLocation, 'static')))

    app.use(staticMiddleware(path.join(__dirname, '../lib/web')))

    app.get('*', (req, res, next) => {
      // If browser requests HTML and request isn't an API request
      if (/html/i.test(req.headers.accept) && !/^\/api\//i.test(req.url)) {
        if (req.url && /^\/lite\//i.test(req.url)) {
          return res.sendFile(path.join(__dirname, '../lib/web/lite.html'))
        }

        return res.sendFile(path.join(__dirname, '../lib/web/index.html'))
      }
      next()
    })

    return Promise.resolve(true)
  }

  return { install }
}
