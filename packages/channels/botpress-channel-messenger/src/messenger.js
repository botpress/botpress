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

  getConfigVal(configKey, pageId) {
    const pageConfig = this.config.pages[pageId]
    return pageConfig && pageConfig[configKey] ? pageConfig[configKey] : this.config[configKey]
  }

  connect(pageIds) {
    return this._setupNewWebhook().then(() => {
      pageIds.forEach(pageId => this._subscribePage(pageId))
    })
  }

  disconnect(pageId) {
    return this._unsubscribePage(pageId)
  }

  sendTextMessage(recipientId, text, quickReplies, options, pageId) {
    const message = { text }
    const formattedQuickReplies = this._formatQuickReplies(quickReplies)
    if (formattedQuickReplies && formattedQuickReplies.length > 0) {
      message.quick_replies = formattedQuickReplies
    }
    return this.sendMessage(recipientId, message, options, pageId)
  }

  sendButtonTemplate(recipientId, text, buttons, options, quickReplies, pageId) {
    const payload = {
      template_type: 'button',
      text
    }
    const formattedButtons = this._formatButtons(buttons)
    payload.buttons = formattedButtons
    return this.sendTemplate(recipientId, payload, options, quickReplies, pageId)
  }

  sendGenericTemplate(recipientId, elements, options, quickReplies, pageId) {
    const payload = {
      template_type: 'generic',
      elements
    }
    return this.sendTemplate(recipientId, payload, options, quickReplies, pageId)
  }

  sendTemplate(recipientId, payload, options, quickReplies, pageId) {
    const message = {
      attachment: {
        type: 'template',
        payload
      }
    }
    const formattedQuickReplies = this._formatQuickReplies(quickReplies)
    if (formattedQuickReplies && formattedQuickReplies.length > 0) {
      message.quick_replies = formattedQuickReplies
    }
    return this.sendMessage(recipientId, message, options, pageId)
  }

  async sendAttachment(recipientId, type, url, quickReplies, options, pageId) {
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

    return this.sendMessage(recipientId, message, options, pageId).then(res => {
      if (res && res.attachment_id) {
        db.addAttachment(url, res.attachment_id)
      }
    })
  }

  sendAction(recipientId, action, pageId) {
    return this.sendRequest(
      {
        recipient: {
          id: recipientId
        },
        sender_action: action
      },
      null,
      null,
      pageId
    )
  }

  sendMessage(recipientId, message, options, pageId) {
    const req = () =>
      this.sendRequest(
        {
          recipient: {
            id: recipientId
          },
          message
        },
        null,
        null,
        pageId
      )

    if (options && options.typing) {
      const autoTimeout = message && message.text ? 500 + message.text.length * 10 : 1000
      const timeout = typeof options.typing === 'number' ? options.typing : autoTimeout
      return this.sendTypingIndicator(recipientId, timeout, pageId).then(req)
    }

    return req()
  }

  sendValidationRequest(pageId) {
    const applicationID = this.config.applicationID
    const accessToken = this.getConfigVal('accessToken', pageId)

    return fetch(`https://graph.facebook.com/v${this.config.graphVersion}/${applicationID}/subscriptions_sample`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        object_id: applicationID,
        object: 'page',
        field: 'messages',
        custom_fields: { pageId: applicationID },
        access_token: accessToken
      })
    })
      .then(this._handleFacebookResponse)
      .then(res => res.json())
  }

  sendRequest(body, endpoint, method, pageId) {
    endpoint = endpoint || 'messages'
    method = method || 'POST'

    const token = this.getConfigVal('accessToken', pageId)
    const url = `https://graph.facebook.com/v${this.config.graphVersion}/me/${endpoint}`
    return fetch(`${url}?access_token=${token}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(this._handleFacebookResponse)
      .then(res => res.json())
      .then(json => {
        this._handleEvent('raw_send_request', {
          url,
          token,
          body,
          endpoint,
          method,
          response: json
        })
        return json
      })
  }

  sendPrivateReply(objectId, text, pageId) {
    const token = this.getConfigVal('accessToken', pageId)
    const url = `https://graph.facebook.com/v${this.config
      .graphVersion}/${objectId}/private_replies?access_token=${token}`
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text
      })
    })
      .then(this._handleFacebookResponse)
      .then(res => res.json())
      .catch(err => console.log(`Error posting private reply: ${err}`))
  }

  sendTypingIndicator(recipientId, milliseconds, pageId) {
    let timeout = !milliseconds || isNaN(milliseconds) ? 0 : milliseconds
    timeout = Math.min(20000, timeout)

    if (milliseconds === true) {
      timeout = 1000
    }

    const before =
      timeout > 0 ? Promise.resolve(this.sendAction(recipientId, 'typing_on', pageId)) : Promise.resolve(true)

    return before.delay(timeout + 1000).then(() => this.sendAction(recipientId, 'typing_off', pageId))
  }

  getUserProfile(userId, pageId, ignoreErrors) {
    const token = this.getConfigVal('accessToken', pageId)
    const profileFields = ['first_name', 'last_name', 'profile_pic'].concat(this.config.extraProfileFields)
    const url = `https://graph.facebook.com/v${this.config.graphVersion}/${userId}?fields=${profileFields.join(
      ','
    )}&access_token=${token}`
    return fetch(url)
      .then(this._handleFacebookResponse)
      .then(res => res.json())
      .catch(err => {
        !ignoreErrors && console.log(`Error getting user profile: ${err}`)
      })
  }

  getPageDetails(pageId) {
    return this._getPage(pageId)
  }

  updateMessengerProfile(pageId) {
    // Accumulate fields for updates/deletes batches
    //  https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api
    const updateFields = {}
    const deleteFields = []

    // Get Started Button
    const displayGetStarted = this.getConfigVal('displayGetStarted', pageId)
    if (displayGetStarted) {
      updateFields.get_started = { payload: 'GET_STARTED' }
    } else {
      deleteFields.push('get_started')
    }

    // Greeting
    const greetingMessage = this.getConfigVal('greetingMessage', pageId)
    if (greetingMessage) {
      updateFields.greeting = [
        {
          // TODO: Support different greetings for different locales
          locale: 'default',
          text: greetingMessage
        }
      ]
    } else {
      deleteFields.push('greeting')
    }

    // Persistent Menu / Composer
    const persistentMenu = this.getConfigVal('persistentMenu', pageId)
    if (persistentMenu) {
      const composerInputDisabled = this.getConfigVal('composerInputDisabled', pageId)
      const persistentMenuItems = this.getConfigVal('persistentMenuItems', pageId)
      updateFields.persistent_menu = [
        {
          // TODO: Support different menus for different locales
          locale: 'default',
          composer_input_disabled: composerInputDisabled,
          call_to_actions: this._formatButtons(this._reformatPersistentMenuItems(persistentMenuItems))
        }
      ]
    } else {
      deleteFields.push('persistent_menu')
    }

    // Target Audience
    switch (this.getConfigVal('targetAudience', pageId)) {
      case 'openToAll':
        updateFields.target_audience = { audience_type: 'all' }
        break

      case 'closeToAll':
        updateFields.target_audience = { audience_type: 'none' }
        break

      case 'openToSome':
        updateFields.target_audience = {
          audience_type: 'custom',
          countries: {
            whitelist: this.getConfigVal('targetAudienceOpenToSome', pageId).split(/, ?/g)
          }
        }
        break

      case 'closeToSome':
        updateFields.target_audience = {
          audience_type: 'custom',
          countries: {
            blacklist: this.getConfigVal('targetAudienceCloseToSome', pageId).split(/, ?/g)
          }
        }
        break
    }

    // Home URL
    const chatExtensionHomeUrl = this.getConfigVal('chatExtensionHomeUrl', pageId)
    if (chatExtensionHomeUrl) {
      updateFields.home_url = {
        url: chatExtensionHomeUrl,
        webview_height_ratio: 'tall',
        webview_share_button: this.getConfigVal('chatExtensionShowShareButton', pageId) ? 'show' : 'hide',
        in_test: this.getConfigVal('chatExtensionInTest', pageId)
      }
    } else {
      deleteFields.push('home_url')
    }

    // Trusted Domains
    const trustedDomains = this.getConfigVal('trustedDomains', pageId)
    if (!_.isEmpty(chatExtensionHomeUrl) && trustedDomains.indexOf(chatExtensionHomeUrl) == -1) {
      trustedDomains.push(chatExtensionHomeUrl)
    }
    updateFields.whitelisted_domains = trustedDomains

    // Payment Testers
    const paymentTesters = this.getConfigVal('paymentTesters', pageId)
    updateFields.payment_settings = {
      testers: paymentTesters
    }

    // Delete & Update the profile settings
    this.sendRequest({ fields: deleteFields }, 'messenger_profile', 'DELETE', pageId)
    this.sendRequest(updateFields, 'messenger_profile', 'POST', pageId)
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
          if (reply.title == 'Send Location' && reply.payload.toUpperCase() == 'SEND LOCATION') {
            return { content_type: 'location' }
          }
          if (reply.title == 'Send Email' && reply.payload.toUpperCase() == 'SEND EMAIL') {
            return { content_type: 'user_email' }
          }
          if (reply.title == 'Send Phone' && reply.payload.toUpperCase() == 'SEND PHONE') {
            return { content_type: 'user_phone_number' }
          }
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
      this.sendAction(event.sender.id, 'mark_seen', event.recipient.id)
    }
  }

  _handleAttachmentEvent(event) {
    this._handleEvent('attachment', event)

    if (event.message && this.config.automaticallyMarkAsRead) {
      this.sendAction(event.sender.id, 'mark_seen', event.recipient.id)
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
      this.sendAction(event.sender.id, 'mark_seen', event.recipient.id)
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
        if (entry && entry.changes) {
          entry.changes.forEach(change => {
            if (change.field == 'feed') {
              this._handleEvent('feed', change.value)
            }
          })
          return
        }

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

  _reformatPersistentMenuItems = items =>
    items.map(item => {
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

  _subscribePage(pageId) {
    const url =
      `https://graph.facebook.com/v${this.config.graphVersion}/me/subscribed_apps?access_token=` +
      this.getConfigVal('accessToken', pageId)

    return fetch(url, { method: 'POST' })
      .then(this._handleFacebookResponse)
      .then(res => res.json())
      .catch(err => console.log(err))
  }

  _unsubscribePage(pageId) {
    const url =
      `https://graph.facebook.com/v${this.config.graphVersion}/me/subscribed_apps?access_token=` +
      this.getConfigVal('accessToken', pageId)

    return fetch(url, { method: 'DELETE' })
      .then(this._handleFacebookResponse)
      .then(res => res.json())
      .catch(err => console.log(err))
  }

  _getPage(pageId) {
    const url =
      `https://graph.facebook.com/v${this.config.graphVersion}/me/?access_token=` +
      this.getConfigVal('accessToken', pageId)

    return fetch(url, { method: 'GET' })
      .then(this._handleFacebookResponse)
      .then(res => res.json())
      .catch(err => console.log(err))
  }
}

module.exports = Messenger
