import path from 'path'
import fs from 'fs'
import Promise from 'bluebird'

import _ from 'lodash'

import listeners from './listeners'
import { resolveProjectFile } from './util'

module.exports = ({ projectLocation, bp }) => {
  const licensesPath = path.join(bp.botpressPath, './licenses')

  const getLicenses = () => {
    const packageJsonPath = resolveProjectFile('package.json', projectLocation, true)
    const { license } = JSON.parse(fs.readFileSync(packageJsonPath))

    const agplContent = fs.readFileSync(path.join(licensesPath, 'LICENSE_AGPL3')).toString()
    const botpressContent = fs.readFileSync(path.join(licensesPath, 'LICENSE_BOTPRESS')).toString()

    return {
      agpl: {
        name: 'AGPL-3.0-only',
        licensedUnder: license === 'AGPL-3.0-only',
        text: agplContent
      },
      botpress: {
        name: 'Botpress',
        licensedUnder: license.toLowerCase().indexOf('botpress') >= 0,
        text: botpressContent
      }
    }
  }

  const changeLicense = Promise.method(license => {
    const packageJsonPath = resolveProjectFile('package.json', projectLocation, true)

    const licensePath = resolveProjectFile('LICENSE', projectLocation, true)
    const licenseFileName = license === 'AGPL-3.0-only' ? 'LICENSE_AGPL3' : 'LICENSE_BOTPRESS'
    const licenseContent = fs.readFileSync(path.join(licensesPath, licenseFileName))

    const pkg = JSON.parse(fs.readFileSync(packageJsonPath))
    pkg.license = license

    fs.writeFileSync(licensePath, licenseContent)
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2))
  })

  const middleware = listeners.hear(/^BOT_LICENSE$/, (event, next) => {
    const packageJsonPath = resolveProjectFile('package.json', projectLocation, true)
    const { license, name, author } = JSON.parse(fs.readFileSync(packageJsonPath))

    const response = `Bot:  ${name}
Created by: ${author}
License: ${license}
Botpress: ${bp.version}`

    const userId = event.user && event.user.id // TODO Use botpress standard user getter

    if (bp[event.platform] && bp[event.platform].sendText) {
      bp[event.platform].sendText(userId, response)
    } else {
      bp.middlewares.sendOutgoing({
        platform: event.platform,
        type: 'text',
        text: response,
        raw: {
          to: userId,
          message: response,
          responseTo: event
        }
      })
    }
  })

  return {
    getLicensing: async () => {
      const licenses = getLicenses()
      const currentLicense = _.find(licenses, { licensedUnder: true }) || licenses.botpress

      return {
        licensed: true,
        name: currentLicense.name,
        status: 'Active',
        text: currentLicense.text
      }
    },
    changeLicense,
    middleware,
    getFeatures: () => ({})
  }
}
