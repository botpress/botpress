const mkdirp = require('mkdirp')
const ncp = require('ncp').ncp
const rimraf = require('rimraf')
const Promise = require('bluebird')

const webpackJs = require('./webpack.js')

const EMAIL_TPL = './extensions/enterprise/pro/emails/templates'
const BOTPRESS_EDITION = process.env.BOTPRESS_EDITION

const rimrafAsync = Promise.promisify(rimraf)
const mkdirpAsync = Promise.promisify(mkdirp)
const ncpAsync = Promise.promisify(ncp)
const webpackAsync = Promise.promisify(webpackJs.run)

const cleanOldBuild = () => {
  console.log('Cleaning old build')
  // call: rm -rf lib/
  return rimrafAsync('./lib')
}

const copyEmailTemplates = async () => {
  if (BOTPRESS_EDITION === 'pro' || BOTPRESS_EDITION === 'ultimate') {
    console.log('Copying email templates')
    // call: mkdir -p lib/emails/templates
    await mkdirpAsync('./lib/emails/templates')

    // call: cp -a
    await ncpAsync(EMAIL_TPL, './lib/emails/templates')
  }
}

const bundleApp = async () => {
  console.log('Bundling app...')
  //node webpack.js --compile
  await webpackAsync()

  console.log('Copying templates')
  // call: mkdir -p lib/cli/templates
  await mkdirpAsync('./lib/cli/templates')
  // call: cp -a
  await ncpAsync('./src/cli/templates', './lib/cli/templates')
}

const build = async () => {
  await cleanOldBuild()
  await copyEmailTemplates()
  await bundleApp()
}

build().then(() => process.exit(0))
