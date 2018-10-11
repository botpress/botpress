/**
 * Messenger
 *
 * This file contains one class Messenger, which in charge of communication between
 * botpress and fb messenger.
 *
 */

const Promise = require('bluebird')
const EventEmitter = require('eventemitter2')
const crypto = require('crypto')
const fetch = require('node-fetch')
const _ = require('lodash')
const bodyParser = require('body-parser')

import DB from './db'

fetch.promise = Promise

const normalizeString = function(str) {
  return str.replace(/[^a-zA-Z0-9]+/g, '').toUpperCase()
}

let db = null

class Messenger extends EventEmitter {
  constructor(bp, config) {
    super()
    if (!bp || !config) {
      throw new Error('You need to specify botpress and config')
    }

    this.setConfig(config)
    this.bp = bp

    bp.db.get().then(k => {
      db = DB(k)
      db.initialize()
    })

    this.app = bp.getRouter('botpress-messenger', {
      'bodyParser.json': false,
      auth: req => !/\/webhook/i.test(req.originalUrl)
    })

    this.app.use(
      bodyParser.json({
        verify: this._verifyRequestSignature.bind(this)
      })
    )

    this._initWebhook()
  }

  setConfig(config) {
    this.config = Object.assign({}, this.config, config)
  }

  getConfig() {
    return this.config
  }

  connect() {
    return this._setupNewWebhook().then(() => this._subscribePage())
  }

  disconnect() {
    return this._unsubscribePage()
  }

  sendTextMessage(recipientId, text, quickReplies, options) {
    const message = { text }
    const formattedQuickReplies = this._formatQuickReplies(quickReplies)
    if (formattedQuickReplies && formattedQuickReplies.length > 0) {
      message.quick_replies = formattedQuickReplies
    }
    return this.sendMessage(recipientId, message, options)
  }

  sendButtonTemplate(recipientId, text, buttons, options) {
    const payload = {
      template_type: 'button',
      text
    }
    const formattedButtons = this._formatButtons(buttons)
    payload.buttons = formattedButtons
    return this.sendTemplate(recipientId, payload, options)
  }

  sendGenericTemplate(recipientId, elements, options) {
    const payload = {
      template_type: 'generic',
      elements
    }
    return this.sendTemplate(recipientId, payload, options)
  }

  sendTemplate(recipientId, payload, options) {
    const message = {
      attachment: {
        type: 'template',
        payload
      }
    }
    return this.sendMessage(recipientId, message, options)
  }

  async sendAttachment(recipientId, type, url, quickReplies, options) {
    const message = {
      attachment: {
        type: type,
        payload: {}
      }
    }

    if (options.isReusable && _.isBoolean(options.isReusable)) {
      message.attachment.payload.is_reusable = options.isReusable
    }

    if (options.attachmentId) {
      message.attachment.payload = {
        attachment_id: options.attachmentId
      }
    } else if (options.isReusable && (await db.hasAttachment(url))) {
      const attachmentId = await db.getAttachment(url)

      message.attachment.payload = {
        attachment_id: attachmentId
      }
    } else {
      message.attachment.payload.url = url
    }

    const formattedQuickReplies = this._formatQuickReplies(quickReplies)
    if (formattedQuickReplies && formattedQuickReplies.length > 0) {
      message.quick_replies = formattedQuickReplies
    }

    return this.sendMessage(recipientId, message, options).then(res => {
      if (res && res.attachment_id) {
        db.addAttachment(url, res.attachment_id)
      }
    })
  }

  sendAction(recipientId, action) {
    return this.sendRequest({
      recipient: {
        id: recipientId
      },
      sender_action: action
    })
  }

  sendMessage(recipientId, message, options) {
    const req = () =>
      this.sendRequest({
        recipient: {
          id: recipientId
        },
        message
      })

    if (options && options.typing) {
      const autoTimeout = message && message.text ? 500 + message.text.length * 10 : 1000
      const timeout = typeof options.typing === 'number' ? options.typing : autoTimeout
      return this.sendTypingIndicator(recipientId, timeout).then(req)
    }

    return req()
  }

  sendValidationRequest() {
    const applicationID = this.config.applicationID
    const accessToken = this.config.accessToken

    return fetch(`https://graph.facebook.com/v${this.config.graphVersion}/${applicationID}/subscriptions_sample`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        object_id: applicationID,
        object: 'page',
        field: 'messages',
        custom_fields: { page_id: applicationID },
        access_token: accessToken
      })
    })
      .then(this._handleFacebookResponse)
      .then(res => res.json())
  }

  sendRequest(body, endpoint, method) {
    endpoint = endpoint || 'messages'
    method = method || 'POST'

    const url = `https://graph.facebook.com/v${this.config.graphVersion}/me/${endpoint}`
    return fetch(`${url}?access_token=${this.config.accessToken}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(this._handleFacebookResponse)
      .then(res => res.json())
      .then(json => {
        this._handleEvent('raw_send_request', {
          url,
          token: this.config.accessToken,
          body,
          endpoint,
          method,
          response: json
        })
        return json
      })
  }

  sendThreadRequest(body, method) {
    return this.sendRequest(body, 'thread_settings', method)
  }

  sendTypingIndicator(recipientId, milliseconds) {
    let timeout = !milliseconds || isNaN(milliseconds) ? 0 : milliseconds
    timeout = Math.min(20000, timeout)

    if (milliseconds === true) {
      timeout = 1000
    }

    const before = timeout > 0 ? Promise.resolve(this.sendAction(recipientId, 'typing_on')) : Promise.resolve(true)

    return before.delay(timeout + 1000).then(() => this.sendAction(recipientId, 'typing_off'))
  }

  getUserProfile(userId) {
    const token = this.config.accessToken
    const profileFields = ['first_name', 'last_name', 'profile_pic'].concat(
      this.config.enableAllProfileFields ? ['locale', 'timezone', 'gender'] : []
    )
    const url = `https://graph.facebook.com/v${this.config.graphVersion}/${userId}?fields=${profileFields.join(
      ','
    )}&access_token=${token}`

    return fetch(url)
      .then(this._handleFacebookResponse)
      .then(res => res.json())
      .catch(err => console.log(`Error getting user profile: ${err}`))
  }

  /**
   * Create the settings to add a new chat extension home url
   *
   * Within the context of this app the "show_share" is a boolean
   * but Facebook either wants a
   */
  createChatExtensionHomeUrlSetting(home_url, in_test, show_share) {
    let show_string = 'hide'
    if (show_share == true) {
      show_string = 'show'
    }

    return {
      home_url: {
        url: home_url,
        webview_height_ratio: 'tall',
        in_test: in_test,
        webview_share_button: show_string
      }
    }
  }

  deleteChatExtensionHomeUrlSetting() {
    return {
      fields: ['home_url']
    }
  }

  deleteChatExtensionHomeUrl() {
    const setting = this.deleteChatExtensionHomeUrlSetting()
    return this.sendRequest(setting, 'messenger_profile', 'DELETE')
  }

  setChatExtensionHomeUrl(home_url, in_test, show_share) {
    const setting = this.createChatExtensionHomeUrlSetting(home_url, in_test, show_share)
    return this.sendRequest(setting, 'messenger_profile', 'POST')
  }

  // add and delete payment testers from application
  // https://developers.facebook.com/docs/messenger-platform/thread-settings/payment#payment_test_users
  deletePaymentTesterSetting(tester) {
    return {
      setting_type: 'payment',
      payment_dev_mode_action: 'REMOVE',
      payment_testers: [tester]
    }
  }
  createPaymentTesterSetting() {
    return {
      setting_type: 'payment',
      payment_dev_mode_action: 'ADD',
      payment_testers: this.config.paymentTesters
    }
  }

  setPaymentTesters() {
    if (this.config.paymentTesters.length == 0) {
      return
    }
    const setting = this.createPaymentTesterSetting()
    return this.sendThreadRequest(setting, 'POST')
  }
  deletePaymentTester(tester) {
    const setting = this.deletePaymentTesterSetting(tester)
    return this.sendThreadRequest(setting, 'POST')
  }

  getPageDetails() {
    return this._getPage()
  }

  displayGetStarted() {
    if (this.config.displayGetStarted) {
      return { type: 'update', field: { name: 'get_started', value: { payload: 'GET_STARTED' } } }
    }

    return { type: 'delete', field: { name: 'get_started' } }
  }

  greetingMessage() {
    const { greetingMessage } = this.config
    const isGreetingMessageEmpty = _.isEmpty(this.config.greetingMessage)

    if (isGreetingMessageEmpty) {
      return { type: 'delete', field: { name: 'greeting' } }
    }

    return {
      type: 'update',
      field: {
        name: 'greeting',
        value: [
          {
            locale: 'default',
            text: greetingMessage
          }
        ]
      }
    }
  }

  persistentMenu() {
    const { composerInputDisabled, persistentMenu, persistentMenuItems } = this.config

    if (!persistentMenu) {
      return { type: 'delete', field: { name: 'persistent_menu' } }
    }

    return {
      type: 'update',
      field: {
        name: 'persistent_menu',
        value: [
          {
            // TODO: Support different menus for different locales
            locale: 'default',
            composer_input_disabled: composerInputDisabled,
            call_to_actions: this._formatButtons(this._reformatPersistentMenuItems(persistentMenuItems))
          }
        ]
      }
    }
  }

  targetAudience() {
    const { targetAudience, targetAudienceOpenToSome, targetAudienceCloseToSome } = this.config

    switch (targetAudience) {
      case 'openToAll':
        return { type: 'update', field: { name: 'target_audience', value: { audience_type: 'all' } } }
      case 'closeToAll':
        return { type: 'update', field: { name: 'target_audience', value: { audience_type: 'none' } } }
      case 'openToSome':
        return {
          type: 'update',
          field: {
            name: 'target_audience',
            value: {
              audience_type: 'custom',
              countries: {
                whitelist: targetAudienceOpenToSome.split(/, ?/g)
              }
            }
          }
        }
      case 'closeToSome':
        return {
          type: 'update',
          field: {
            name: 'target_audience',
            value: {
              audience_type: 'custom',
              countries: {
                blacklist: targetAudienceCloseToSome.split(/, ?/g)
              }
            }
          }
        }
      default:
        return { type: 'update', field: { name: 'target_audience', value: { audience_type: 'all' } } }
    }
  }

  chatExtensionHomeUrl() {
    const { chatExtensionHomeUrl, chatExtensionShowShareButton, chatExtensionInTest } = this.config

    if (!chatExtensionHomeUrl) {
      return { type: 'delete', field: { name: 'home_url' } }
    }

    return {
      type: 'update',
      field: {
        name: 'home_url',
        value: {
          url: chatExtensionHomeUrl,
          webview_height_ratio: 'tall',
          webview_share_button: chatExtensionShowShareButton ? 'show' : 'hide',
          in_test: chatExtensionInTest
        }
      }
    }
  }

  trustedDomains() {
    const { trustedDomains, chatExtensionHomeUrl } = this.config
    if (!_.isEmpty(chatExtensionHomeUrl) && trustedDomains.indexOf(chatExtensionHomeUrl) === -1) {
      trustedDomains.push(chatExtensionHomeUrl)
    }

    if (_.isEmpty(trustedDomains)) {
      return { type: 'next' }
    }

    return { type: 'update', field: { name: 'whitelisted_domains', value: trustedDomains } }
  }

  paymentTesters() {
    const { paymentTesters } = this.config

    return { type: 'update', field: { name: 'payment_settings', value: { testers: paymentTesters } } }
  }

  updateSettings() {
    const messageConfigKeys = Object.keys(this.config)

    const profileFields = messageConfigKeys.reduce(
      (settings, key) => {
        if (!this[key]) {
          return settings
        }

        const { type, field } = this[key]()

        if (type === 'next') {
          return settings
        }

        if (type === 'update') {
          settings.update[field.name] = field.value
        }

        if (type === 'delete') {
          settings.delete.push(field.name)
        }

        return settings
      },
      { update: {}, delete: [] }
    )

    this.sendRequest({ fields: profileFields.delete }, 'messenger_profile', 'DELETE')
    this.sendRequest(profileFields.update, 'messenger_profile', 'POST')
  }

  module(factory) {
    return factory.apply(this, [this])
  }

  _formatButtons(buttons) {
    return (
      buttons &&
      buttons.map(button => {
        if (typeof button === 'string') {
          return {
            type: 'postback',
            title: button,
            payload: 'BUTTON_' + normalizeString(button)
          }
        }
        return button
      })
    )
  }

  _formatQuickReplies(quickReplies) {
    return (
      quickReplies &&
      quickReplies.map(reply => {
        if (typeof reply === 'string') {
          return {
            content_type: 'text',
            title: reply,
            payload: 'QR_' + normalizeString(reply)
          }
        } else if (reply && reply.title) {
          return {
            content_type: reply.content_type || 'text',
            title: reply.title,
            payload: reply.payload || 'QR_' + normalizeString(reply.title),
            image_url: reply.image_url
          }
        }
        return reply
      })
    )
  }

  _handleEvent(type, event) {
    this.emit(type, event)
  }

  _handleMessageEvent(event) {
    const text = event.message.text
    if (!text) {
      return
    }

    this._handleEvent('message', event)

    if (event.message && this.config.automaticallyMarkAsRead) {
      this.sendAction(event.sender.id, 'mark_seen')
    }
  }

  _handleAttachmentEvent(event) {
    this._handleEvent('attachment', event)

    if (event.message && this.config.automaticallyMarkAsRead) {
      this.sendAction(event.sender.id, 'mark_seen')
    }
  }

  _handlePostbackEvent(event) {
    const payload = event.postback.payload
    if (payload) {
      this._handleEvent(`postback:${payload}`, event)
    }
    this._handleEvent('postback', event)
  }

  _handleQuickReplyEvent(event) {
    const payload = event.message.quick_reply && event.message.quick_reply.payload
    if (payload) {
      this._handleEvent(`quick_reply:${payload}`, event)
    }
    this._handleEvent('quick_reply', event)

    if (event.message && this.config.automaticallyMarkAsRead) {
      this.sendAction(event.sender.id, 'mark_seen')
    }
  }

  _handleFacebookResponse(res) {
    if (!res) {
      return
    }

    if (res.status < 400) {
      return res
    }

    let errorMessage = 'An error has been returned by Facebook API.'
    errorMessage += '\nStatus: ' + res.status + ' (' + res.statusText + ')'

    return Promise.resolve(true)
      .then(() => res.json && res.json())
      .then(json => {
        errorMessage += '\n' + json.error.message
        if (json.error.error_user_title) {
          errorMessage += '\n' + json.error.error_user_title
          errorMessage += '\n' + json.error.error_user_msg
        }
      })
      .finally(() => {
        throw new Error(errorMessage)
      })
  }

  _initWebhook() {
    this.app.get('/webhook', (req, res) => {
      if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === this.config.verifyToken) {
        res.status(200).send(req.query['hub.challenge'])
      } else {
        console.error('Failed validation. Make sure the validation tokens match.')
        res.sendStatus(403)
      }
    })

    this.app.post('/webhook', (req, res) => {
      const data = req.body
      if (data.object !== 'page') {
        return
      }

      this._handleEvent('raw_webhook_body', data)

      // Iterate over each entry. There may be multiple if batched.
      data.entry.forEach(entry => {
        if (entry && !entry.messaging) {
          return
        }
        // Iterate over each messaging event
        entry.messaging.forEach(event => {
          if (event.message && event.message.is_echo && !this.config.broadcastEchoes) {
            return
          }
          if (event.message && event.message.text) {
            if (event.message.quick_reply) {
              this._handleQuickReplyEvent(event)
            } else {
              this._handleMessageEvent(event)
            }
          } else if (event.message && event.message.attachments) {
            this._handleAttachmentEvent(event)
          } else if (event.postback) {
            this._handlePostbackEvent(event)
          } else if (event.delivery) {
            this._handleEvent('delivery', event)
          } else if (event.read) {
            this._handleEvent('read', event)
          } else if (event.account_linking) {
            this._handleEvent('account_linking', event)
          } else if (event.optin) {
            this._handleEvent('optin', event)
          } else if (event.referral) {
            this._handleEvent('referral', event)
          } else if (event.payment) {
            this._handleEvent('payment', event)
          } else {
            console.log('Webhook received unknown event: ', event)
          }
        })
      })

      // Must send back a 200 within 20 seconds or the request will time out.
      res.sendStatus(200)
    })
  }

  _verifyRequestSignature(req, res, buf) {
    if (!/^\/webhook/i.test(req.path)) {
      return
    }

    const signature = req.headers['x-hub-signature']
    if (!signature) {
      throw new Error("Couldn't validate the request signature.")
    } else {
      const [, hash] = signature.split('=')
      const expectedHash = crypto
        .createHmac('sha1', this.config.appSecret)
        .update(buf)
        .digest('hex')

      if (hash != expectedHash) {
        throw new Error("Couldn't validate the request signature.")
      }
    }
  }

  _reformatPersistentMenuItems() {
    if (this.config.persistentMenu && this.config.persistentMenuItems) {
      return this.config.persistentMenuItems.map(item => {
        if (item.value && item.type === 'postback') {
          item.payload = item.value
          delete item.value
        } else if (item.value && item.type === 'url') {
          item.url = item.value
          item.type = 'web_url'
          delete item.value
        }
        return item
      })
    }
  }

  _setupNewWebhook() {
    const oAuthUrl =
      `https://graph.facebook.com/v${this.config.graphVersion}/oauth/access_token` +
      '?client_id=' +
      this.config.applicationID +
      '&client_secret=' +
      this.config.appSecret +
      '&grant_type=client_credentials'

    const url = `https://graph.facebook.com/v${this.config.graphVersion}/${this.config
      .applicationID}/subscriptions?access_token=`

    return fetch(oAuthUrl)
      .then(this._handleFacebookResponse)
      .then(res => res.json())
      .then(json => json.access_token)
      .then(token =>
        fetch(url + token, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            object: 'page',
            callback_url: 'https://' + this.config.hostname + '/api/botpress-messenger/webhook',
            verify_token: this.config.verifyToken,
            fields: this.config.webhookSubscriptionFields
          })
        })
      )
      .then(this._handleFacebookResponse)
      .then(res => res.json())
  }

  _subscribePage() {
    const url =
      `https://graph.facebook.com/v${this.config.graphVersion}/me/subscribed_apps?access_token=` +
      this.config.accessToken

    return fetch(url, { method: 'POST' })
      .then(this._handleFacebookResponse)
      .then(res => res.json())
      .catch(err => console.log(err))
  }

  _unsubscribePage() {
    const url =
      `https://graph.facebook.com/v${this.config.graphVersion}/me/subscribed_apps?access_token=` +
      this.config.accessToken

    return fetch(url, { method: 'DELETE' })
      .then(this._handleFacebookResponse)
      .then(res => res.json())
      .catch(err => console.log(err))
  }

  _getPage() {
    const url = `https://graph.facebook.com/v${this.config.graphVersion}/me/?access_token=` + this.config.accessToken

    return fetch(url, { method: 'GET' })
      .then(this._handleFacebookResponse)
      .then(res => res.json())
      .catch(err => console.log(err))
  }
}

module.exports = Messenger
