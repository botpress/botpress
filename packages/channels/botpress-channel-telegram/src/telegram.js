process.env.NTBA_FIX_319 = true // See https://github.com/yagop/node-telegram-bot-api/issues/319

const TelegramBot = require('node-telegram-bot-api')
const Promise = require('bluebird')

import incoming from './incoming'

class Telegram {
  constructor(bp, config) {
    if (!bp || !config) {
      throw new Error('You need to specify botpress and config')
    }

    this.bot = null
    this.connected = false
    this.bot = new TelegramBot(config.botToken)
    bp.logger.info('Telegram bot created')
  }

  setConfig(config) {
    this.config = Object.assign({}, this.config, config)
  }

  validateConnection() {
    if (!this.connected) {
      throw new Error('You are not connected...')
    }
  }

  static validateText(text) {
    const type = typeof text
    if (type !== 'string') {
      throw new Error('Text format is not valid (actual: ' + type + ', required: string)')
    }
  }

  static validateChatId(chatId) {
    const type = typeof chatId
    if (type !== 'number') {
      throw new Error('Chat id format is not valid (actual: ' + type + ', required: number)')
    }
  }

  static validateAttachments(attachments) {
    const type = typeof attachments
    if (type !== 'object') {
      throw new Error('Attachments format is not valid (actual: ' + type + ', required: object)')
    }
  }

  static validateOptions(options) {
    const type = typeof options
    if (type !== 'object') {
      throw new Error('Options format is not valid (actual: ' + type + ', required: object)')
    }
  }

  static validateBeforeReaction(options) {
    if (!(options.file || options.file_comment || options.chat || options.timestamp)) {
      throw new Error('You need to set at least a destination options (file, file_comment, chat, timestamp)...')
    }
  }

  validateBeforeSending(chatId, options) {
    this.validateConnection()
    Telegram.validateChatId(chatId)
    Telegram.validateOptions(options)
  }

  sendText(chatId, text, options) {
    this.validateBeforeSending(chatId, options)
    Telegram.validateText(text)

    return Promise.fromCallback(() => {
      this.bot.sendMessage(chatId, text, options)
    })
  }

  sendEditMessage(text, options = {}) {
    this.validateBeforeSending(options.chat_id, options)
    Telegram.validateText(text)

    return Promise.fromCallback(() => {
      this.bot.editMessageText(text, options)
    })
  }

  startPolling(bp) {
    incoming(bp, this)
    bp.logger.info('Telegram loaded handler')
    this.bot.startPolling()
    bp.logger.info('Telegram started polling')
    this.connected = true
  }
}

module.exports = Telegram
