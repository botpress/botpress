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
    const url = `https://graph.facebook.com/v${this.config
      .graphVersion}/${userId}?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=${token}`
    return fetch(url)
      .then(this._handleFacebookResponse)
      .then(res => res.json())
      .catch(err => console.log(`Error getting user profile: ${err}`))
  }

  createTargetAudienceSetting() {
    const setting = { target_audience: {} }

    switch (this.config.targetAudience) {
      case 'openToAll':
        setting.target_audience.audience_type = 'all'
        break

      case 'openToSome':
        const countriesWhitelist = this.config.targetAudienceOpenToSome.split(/, ?/g)
        setting.target_audience.audience_type = 'custom'
        setting.target_audience.countries = {
          whitelist: countriesWhitelist
        }
        break

      case 'closeToSome':
        setting.target_audience.audience_type = 'custom'
        const countriesBlacklist = this.config.targetAudienceCloseToSome.split(/, ?/g)
        setting.target_audience.countries = {
          blacklist: countriesBlacklist
        }
        break

      case 'closeToAll':
        setting.target_audience.audience_type = 'none'
        break
    }

    return setting
  }

  setTargetAudience() {
    const setting = this.createTargetAudienceSetting()
    return this.sendRequest(setting, 'messenger_profile', 'POST')
  }

  async setWhitelistedDomains(domains, chatExtensionHomeUrl) {
    // the chat extension home url is controlled by a different state value
    // but it still needs to be whitelisted.  It's also possible that this url
    // has already been whitelisted for another purpose
    // so we need to check:
    //    a) that it's set, and
    //    b) that it's not already in the list
    if (!_.isEmpty(chatExtensionHomeUrl)) {
      if (domains.indexOf(chatExtensionHomeUrl) == -1) {
        domains.push(chatExtensionHomeUrl)
      }
    }

    const url = `https://graph.facebook.com/v${this.config.graphVersion}/me/messenger_profile?access_token=${this.config
      .accessToken}`

    await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: ['whitelisted_domains']
      })
    }).then(this._handleFacebookResponse)

    if (domains.length === 0) {
      return
    }

    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        whitelisted_domains: domains
      })
    }).then(this._handleFacebookResponse)
  }

  setGreetingText(text) {
    return this.sendThreadRequest({
      setting_type: 'greeting',
      greeting: { text }
    })
  }

  deleteGreetingText() {
    return this.sendThreadRequest(
      {
        setting_type: 'greeting'
      },
      'DELETE'
    )
  }

  setGetStartedButton(action) {
    const payload = typeof action === 'string' ? action : 'GET_STARTED'
    if (typeof action === 'function') {
      this.on(`postback:${payload}`, action)
    }
    return this.sendThreadRequest({
      setting_type: 'call_to_actions',
      thread_state: 'new_thread',
      call_to_actions: [{ payload }]
    })
  }

  deleteGetStartedButton() {
    return this.sendThreadRequest(
      {
        setting_type: 'call_to_actions',
        thread_state: 'new_thread'
      },
      'DELETE'
    )
  }

  setPersistentMenu(buttons, composerInputDisabled) {
    const formattedButtons = this._formatButtons(buttons)
    return this.sendRequest(
      {
        persistent_menu: [
          {
            // TODO Allow setting multiple menues for different locales
            locale: 'default',
            composer_input_disabled: composerInputDisabled,
            call_to_actions: formattedButtons
          }
        ]
      },
      'messenger_profile'
    )
  }

  deletePersistentMenu() {
    return this.sendRequest(
      {
        fields: ['persistent_menu']
      },
      'messenger_profile',
      'DELETE'
    )
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

  updateSettings() {
    const updateGetStarted = () =>
      this.config.displayGetStarted ? this.setGetStartedButton() : this.deleteGetStartedButton()

    const updateGreetingText = () =>
      _.isEmpty(this.config.greetingMessage)
        ? this.deleteGreetingText()
        : this.setGreetingText(this.config.greetingMessage)

    const items = this._reformatPersistentMenuItems(this.config.persistentMenuItems)
    const updatePersistentMenu = () =>
      this.config.persistentMenu
        ? this.setPersistentMenu(items, this.config.composerInputDisabled)
        : this.deletePersistentMenu()

    const updateTargetAudience = () => this.setTargetAudience()

    const updateTrustedDomains = () =>
      this.setWhitelistedDomains(this.config.trustedDomains, this.config.chatExtensionHomeUrl)

    const updateChatExtensionHomeUrl = () =>
      _.isEmpty(this.config.chatExtensionHomeUrl)
        ? this.deleteChatExtensionHomeUrl()
        : this.setChatExtensionHomeUrl(
            this.config.chatExtensionHomeUrl,
            this.config.chatExtensionInTest,
            this.config.chatExtensionShowShareButton
          )

    const updatePaymentTesters = () => this.setPaymentTesters()

    let thrown = false
    const contextifyError = context => err => {
      if (thrown) {
        throw err
      }
      const message = `Error setting ${context}\n${err.message}`
      thrown = true
      throw new Error(message)
    }

    return updateGetStarted()
      .catch(contextifyError('get started'))
      .then(updateGreetingText)
      .catch(contextifyError('greeting text'))
      .then(updatePersistentMenu)
      .catch(contextifyError('persistent menu'))
      .then(updateTargetAudience)
      .catch(contextifyError('target audience'))
      .then(updateTrustedDomains)
      .catch(contextifyError('trusted domains'))
      .then(updateChatExtensionHomeUrl)
      .catch(contextifyError('chat extensions'))
      .then(updatePaymentTesters)
      .catch(contextifyError('payment testers'))
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
