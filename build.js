const mkdirp = require('mkdirp')
const ncp = require('ncp').ncp
const rimraf = require('rimraf')
const Promise = require('bluebird')
const webpackJs = require('./webpack.js')

var EMAIL_TPL = './extensions/enterprise/pro/emails/templates'
var BOTPRESS_EDITION = process.env.BOTPRESS_EDITION

const cleanOldBuild = cb => {
  console.log('Cleaning old build')
  // call: rm -rf lib/
  rimraf('./lib', err => {
    cb(err)
  })
}

const copyEmailTemplates = cb => {
  if (BOTPRESS_EDITION === 'pro' || BOTPRESS_EDITION === 'ultimate') {
    console.log('Copying email templates')
    // call: mkdir -p lib/emails/templates
    mkdirp('./lib/emails/templates', err => {
      if (err) {
        return cb(err)
      }

      // call: cp -a
      ncp(EMAIL_TPL, './lib/emails/templates', err => {
        cb(err)
      })
    })
  } else {
    cb()
  }
}

const bundleApp = cb => {
  console.log('Bundling app...')
  //node webpack.js --compile
  webpackJs.run(err => {
    if (err) {
      return cb(err)
    }

    console.log('Copying templates')
    // call: mkdir -p lib/cli/templates
    mkdirp('./lib/cli/templates', err => {
      if (err) {
        return cb(err)
      } else {
        // call: cp -a
        ncp('./src/cli/templates', './lib/cli/templates', err => {
          cb(err)
        })
      }
    })
  })
}

const execute = async () => {
  await Promise.fromCallback(callback => cleanOldBuild(callback))
  await Promise.fromCallback(callback => copyEmailTemplates(callback))
  await Promise.fromCallback(callback => bundleApp(callback))
  process.exit(0)
}

execute()
