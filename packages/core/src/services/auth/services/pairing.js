import _ from 'lodash'

import { UnauthorizedAccessError, InvalidOperationError, NotFoundError } from '~/errors'

const debug = require('debug')('svc:bot')

export default ({ db }) => {
  async function pairBot({ token, name, description = '' }) {
    debug(`Pairing bot "${token}"`)

    const bot = await db.models.bot.findOne({
      where: { pairingToken: token }
    })

    if (!bot) {
      throw new NotFoundError('Invalid token')
    }

    if (bot.paired) {
      throw new InvalidOperationError('The bot associated with this token was already paired.')
    }

    Object.assign(bot, {
      name,
      description,
      paired: true,
      pairedAt: new Date()
    })

    await bot.save()

    return { botId: bot.publicId, teamId: bot.teamId }
  }

  async function getBotByPublicId(publicId) {
    debug(`Getting bot "${publicId}"`)

    const bot = await db.models.bot.findOne({
      where: {
        publicId: publicId,
        paired: true
      }
    })

    if (!bot) {
      throw new NotFoundError('Bot not found')
    }

    return _.pick(bot, ['publicId', 'id', 'teamId', 'pairedAt', 'name', 'description'])
  }

  async function updateEnv({ token, env, botUrl }) {
    const bot = await db.models.bot.findOne({
      where: {
        pairingToken: token,
        paired: true
      }
    })

    if (!bot) {
      throw new UnauthorizedAccessError('Invalid bot token')
    }

    let botenv = await db.models.botenv.findOne({
      where: {
        name: env,
        botId: bot.id
      }
    })

    if (!botenv) {
      botenv = db.models.botenv.build({
        botId: bot.id,
        name: env
      })
    }

    Object.assign(botenv, {
      botUrl,
      lastStartedAt: new Date()
    })

    await botenv.save()

    return { botId: bot.publicId, env: env, botUrl: botUrl }
  }

  async function getEnv({ botId, env }) {
    const botenv = await db.models.botenv.findOne({
      where: {
        name: env,
        botId: botId
      }
    })

    if (!botenv) {
      throw new NotFoundError(`Environment "${env}" does not exist`)
    }

    return _.pick(botenv, ['botUrl', 'name', 'lastStartedAt', 'createdAt', 'botId'])
  }

  return {
    pairBot,
    getBotByPublicId,
    updateEnv,
    getEnv
  }
}
