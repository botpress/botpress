const path = require('path')
const mkdirp = require('mkdirp')
const ncp = require('ncp').ncp
const rimraf = require('rimraf')
const webpackJs = require('./webpack.js')

var EMAIL_TPL = './extensions/enterprise/pro/emails/templates'
var BOTPRESS_EDITION = process.env.BOTPRESS_EDITION

const cleanOldBuild = () => {
  return new Promise((resolve, reject) => {
    console.log('Cleaning old build')
    // call: rm -rf lib/
    rimraf('./lib', err => {
      if (err) {
        reject(err)
        return
      }
      resolve()
    })
  })
}

const copyEmailTemplates = () => {
  return new Promise((resolve, reject) => {
    if (BOTPRESS_EDITION === 'pro' || BOTPRESS_EDITION === 'ultimate') {
      console.log('Copying email templates')
      // call: mkdir -p lib/emails/templates
      mkdirp('./lib/emails/templates', err => {
        if (err) {
          reject(err)
          return
        }

        // call: cp -a
        ncp(EMAIL_TPL, './lib/emails/templates', err => {
          if (err) {
            reject(err)
            return
          }
          resolve()
        })
      })
    } else {
      resolve()
    }
  })
}

const bundleApp = () => {
  return new Promise((resolve, reject) => {
    console.log('Bundling app...')
    //node webpack.js --compile
    webpackJs.run(err => {
      if (err) {
        reject(err)
        return
      }

      console.log('Copying templates')
      // call: mkdir -p lib/cli/templates
      mkdirp('./lib/cli/templates', err => {
        if (err) {
          reject(err)
          return
        } else {
          // call: cp -a
          ncp('./src/cli/templates', './lib/cli/templates', err => {
            if (err) {
              reject(err)
              return
            }
            resolve()
          })
        }
      })
    })
  })
}

const execute = async () => {
  await cleanOldBuild()
  await copyEmailTemplates()
  await bundleApp()
  process.exit(0)
}

execute()
