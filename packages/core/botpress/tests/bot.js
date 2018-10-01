/* global before */

import { expect } from 'chai'
import path from 'path'
import { existsSync, symlinkSync } from 'fs'
import { exec, execSync, spawnSync } from 'child_process'
import moment from 'moment'
import rimraf from 'rimraf'

const bin = path.resolve(__dirname, '../bin/botpress')
const botDir = path.resolve(__dirname, '../tmp-bot')
const botConfig = path.resolve(__dirname, `${botDir}/config`)
const rootDir = path.resolve(__dirname, '../../../../')
const configVar = require('./config/env.js')

const botpressModules = {
  botpress: './packages/core/botpress',
  '@botpress/channel-messenger': './packages/channels/botpress-channel-messenger',
  '@botpress/channel-slack': './packages/channels/botpress-channel-slack',
  '@botpress/channel-telegram': './packages/channels/botpress-channel-telegram',
  '@botpress/channel-twilio': './packages/channels/botpress-channel-twilio',
  '@botpress/channel-microsoft': './packages/channels/botpress-channel-microsoft',
  '@botpress/channel-web': './packages/channels/botpress-channel-web',
  '@botpress/analytics': './packages/functionals/botpress-analytics',
  '@botpress/audience': './packages/functionals/botpress-audience',
  '@botpress/broadcast': './packages/functionals/botpress-broadcast',
  '@botpress/hitl': './packages/functionals/botpress-hitl',
  '@botpress/nlu': './packages/functionals/botpress-nlu',
  '@botpress/qna': './packages/functionals/botpress-qna',
  '@botpress/scheduler': './packages/functionals/botpress-scheduler',
  '@botpress/terminal': './packages/functionals/botpress-terminal',
  '@botpress/builtins': './packages/core/botpress-builtins',
  '@botpress/util-roles': './packages/core/botpress-util-roles',
  '@botpress/skill-choice': './packages/skills/botpress-skill-choice'
}

const LAUNCHED = /Bot launched/gi
const TWENTY_MIN = 1200000

describe('Running new bot', function() {
  this.timeout(TWENTY_MIN)

  let hasError = false
  const checkTaskStatus = err => {
    hasError = err
    expect(err).to.be.null
  }

  before(done => {
    if (existsSync(botDir)) {
      rimraf.sync(botDir)
    }
    done()
  })

  beforeEach(done => {
    // Tests here depend on previous steps so doesn't make sense to run further steps if previous failed
    expect(!!hasError).to.be.false
    done()
  })

  it('compile modules', done => {
    const lerna = './node_modules/.bin/lerna'
    spawnSync('yarn', { cwd: rootDir })
    exec(`${lerna} bootstrap && ${lerna} run compile`, { cwd: rootDir }, err => {
      checkTaskStatus(err)
      done()
    })
  })

  it('botpress init', done => {
    exec(`node ${bin} init ${botDir} -y`, err => {
      checkTaskStatus(err)
      done()
    })
  })

  it('bot starts', done => {
    // Create config-files
    rimraf.sync(botConfig)
    spawnSync(`cp -a ./tests/config ${botDir}`)

    // Install dependencies and link to modules that we compiled
    spawnSync('yarn', { cwd: botDir })
    Object.entries(botpressModules).forEach(([name, modulePath]) => {
      const linkPath = `${botDir}/node_modules/${name}`
      if (existsSync(linkPath)) {
        rimraf.sync(linkPath)
      }
      symlinkSync(path.resolve(rootDir, modulePath), linkPath)
    })

    let lastDate = moment().toDate()
    let isLaunched = false
    const botProcess = exec('NODE_ENV=test node index.js', { cwd: botDir, env: configVar }, err => {
      checkTaskStatus(err)
    })
    const CHECKING_BOT_STATUS_EVERY = 5000

    botProcess.stdout.on('data', data => {
      const lastLog = data.toString()
      const hasError = /error/gi.test(lastLog)
      const date = lastLog.match(/[0-9:]+/g)
      isLaunched = isLaunched || LAUNCHED.test(lastLog)

      lastDate = date ? moment(date[0], 'HH:mm:ss').toDate() : lastDate

      expect(hasError).to.be.false
    })

    const botStateCheck = setInterval(() => {
      const ALL_DONE = 10000
      const now = moment().toDate()
      const isEnd = isLaunched && now - moment(lastDate, 'HH:mm:ss').toDate() > ALL_DONE

      if (isEnd) {
        botProcess.kill('SIGINT')
        clearInterval(botStateCheck)
        done()
      }
    }, CHECKING_BOT_STATUS_EVERY)
  })
})
