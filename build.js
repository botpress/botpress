var mkdirp = require('mkdirp')
var ncp = require('ncp').ncp
var remove = require('remove')
var Sync = require('sync')
var webpackJs = require('./webpack.js')

var EMAIL_TPL = './extensions/enterprise/pro/emails/templates'
var BOTPRESS_EDITION = process.env.BOTPRESS_EDITION

function cleanOldBuild() {
  console.log('Cleaning old build')
  try {
    remove.removeSync('./lib')
  } catch (err) {
    // ignore directory missing error
    if (err.errno !== -4058) {
      // rethrow the error
      throw err
    }
  }
}

function copyEmailTemplates() {
  if (BOTPRESS_EDITION === 'pro' || BOTPRESS_EDITION === 'ultimate') {
    console.log('Copying email templates')
    // call: mkdir -p lib/emails/templates
    mkdirp.sync('./lib/emails/templates')
    // call: cp -a
    Sync(
      function() {
        ncp.sync(null, EMAIL_TPL, './lib/emails/templates')
      },
      function(err) {
        if (err) {
          console.error(err)
        }
      }
    )
  }
}

function bundleApp(cb) {
  console.log('Bundling app...')
  //node webpack.js --compile
  webpackJs.run(copyTemplates)
}

function copyTemplates() {
  console.log('Copying templates')
  // call: mkdir -p lib/cli/templates
  mkdirp.sync('./lib/cli/templates')
  // call: cp -a
  Sync(
    function() {
      ncp.sync(null, './src/cli/templates', './lib/cli/templates')
    },
    function(err) {
      if (err) {
        console.error(err)
      }
    }
  )
}

cleanOldBuild()
copyEmailTemplates()
bundleApp()
