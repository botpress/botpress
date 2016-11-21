import path from 'path'
import fs from 'fs'
import Promise from 'bluebird'
import _ from 'lodash'

module.exports = (bp) => {

  const licensesPath = path.join(__dirname, '../licenses')

  const getPackageJSONPath = () => {
    let projectLocation = (bp && bp.projectLocation) || './'
    let packagePath = path.resolve(projectLocation, './package.json')

    if (!fs.existsSync(packagePath)) {
      log('warn', 'Could not find bot\'s package.json file')
      return []
    }

    return packagePath
  }

  const getLicensePath = () => {
    let projectLocation = (bp && bp.projectLocation) || './'
    let licensePath = path.resolve(projectLocation, './LICENSE')

    if (!fs.existsSync(licensePath)) {
      log('warn', 'Could not find bot\'s license file')
      return []
    }

    return licensePath
  }

  const getLicenses = () => {
    const packageJSON = JSON.parse(fs.readFileSync(getPackageJSONPath()))
    const actualLicense = packageJSON.license
    const licenseAGPL = fs.readFileSync(path.join(licensesPath, 'LICENSE_AGPL3')).toString()
    const licenseBotpress = fs.readFileSync(path.join(licensesPath, 'LICENSE_BOTPRESS')).toString()

    return {
      agpl: {
        name: 'AGPL-3.0',
        licensedUnder: actualLicense === 'AGPL-3.0',
        text: licenseAGPL
      },
      botpress: {
        name: 'Botpress',
        licensedUnder: actualLicense === 'Botpress',
        text: licenseBotpress
      }
    }
  }

  const changeLicense = Promise.method((license) => {
    const licenseFile = (license === 'AGPL-3.0') ? 'LICENSE_AGPL3' : 'LICENSE_BOTPRESS'
    const licenseContent = fs.readFileSync(path.join(licensesPath, licenseFile))
    fs.writeFileSync(getLicensePath(), licenseContent)

    let packageJSON = JSON.parse(fs.readFileSync(getPackageJSONPath()))
    packageJSON.license = license

    fs.writeFileSync(getPackageJSONPath(), JSON.stringify(packageJSON))
  })

  const applyLicenseMiddleware = () => {
    bp.hear(/^BOT_LICENSE$/, (event, next) => {
      let packageJSON = JSON.parse(fs.readFileSync(getPackageJSONPath()))
      const license = packageJSON.license
      const botName = packageJSON.name
      const author = packageJSON.author
      const response = "Bot: " + botName + "\n" 
        + "Created by: " + author + "\n"
        + "License: " + license + "\n"
        + "Botpress: " + bp.version

      if (bp[event.platform] && bp[event.platform].pipeText) {
        bp[event.platform].pipeText(event.user.id, response)
      } else {
        bp.outgoing({
          platform: event.platform,
          type: 'text',
          text: response,
          raw: {
            to: event.user.id,
            message: response,
            responseTo: event
          }
        })
      }
    })
  }

  return {
    getLicenses: getLicenses,
    changeLicense: changeLicense,
    applyLicenseMiddleware: applyLicenseMiddleware
  }
}
