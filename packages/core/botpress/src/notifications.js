import _ from 'lodash'
import nanoid from 'nanoid'

import helpers from './database/helpers'

import { resolveModuleRootPath } from './util'

const getOriginatingModule = () => {
  const origPrepareStackTrace = Error.prepareStackTrace
  Error.prepareStackTrace = (_, stack) => stack

  const err = new Error()
  const stack = err.stack
  Error.prepareStackTrace = origPrepareStackTrace
  stack.shift()

  return stack[1].getFileName()
}

const notifications = ({ knex, modules, logger, events }) => {
  const toDatabase = (knex, notification) => ({
    id: notification.id,
    message: notification.message,
    level: notification.level,
    module_id: notification.moduleId,
    module_icon: notification.icon,
    module_name: notification.name,
    redirect_url: notification.url,
    created_on: helpers(knex).date.now(),
    read: helpers(knex).bool.false(),
    archived: helpers(knex).bool.false()
  })

  const fromDatabase = (knex, row) => ({
    id: row.id,
    message: row.message,
    level: row.level,
    moduleId: row.module_id,
    icon: row.module_icon,
    name: row.module_name,
    url: row.redirect_url,
    date: new Date(row.created_on),
    sound: false,
    read: helpers(knex).bool.parse(row.read)
  })

  // TODO: a bunch of functions below doesn't use `await`, should they actually be `async`?

  /**
   * Marks a single notification as read (but doesn't archive it)
   * @param  {string} notificationId The id of the notification to mark as read
   * @return {Promise}
   */
  const markAsRead = async notificationId =>
    knex('notifications')
      .where({ id: notificationId })
      .update({ read: helpers(knex).bool.true() })
      .then()

  /**
   * Marks all notifications as read (but doesn't archive them)
   * @return {Promise}
   */
  const markAllAsRead = async () =>
    knex('notifications')
      .update({ read: helpers(knex).bool.true() })
      .then()

  /**
   * Get the top 100 (unseen) notifications
   * @return {Promise<Array<Notification>>} The list of all unseen notifications
   */
  const getInbox = async () =>
    knex('notifications')
      .where({ archived: helpers(knex).bool.false() })
      .orderBy('created_on', 'DESC')
      .limit(100)
      .then(rows => rows.map(row => fromDatabase(knex, row)))

  /**
   * Returns all archived notifications
   * @return {Promise<Array<Notification>>} The list of all archived notifications
   */
  const getArchived = async () =>
    knex('notifications')
      .where({ archived: helpers(knex).bool.true() })
      .orderBy('created_on', 'DESC')
      .limit(100)
      .then(rows => rows.map(row => fromDatabase(knex, row)))

  /**
 * Archives a single notification
 * @param  {string} notificationId The id of the notification to archive
 * @return {Promise}
 */
  const archive = async notificationId =>
    knex('notifications')
      .where({ id: notificationId })
      .update({ archived: helpers(knex).bool.true() })
      .then()

  /**
 * Archives all notifications
 * @return {Promise}
 */
  const archiveAll = async () =>
    knex('notifications')
      .update({ archived: helpers(knex).bool.true() })
      .then()

  // Internal use only
  // Binds events to actions
  const _bindEvents = () => {
    events.on('notifications.getAll', async () => {
      events.emit('notifications.all', await getInbox())
    })

    events.on('notifications.read', async id => {
      await markAsRead(id)
      events.emit('notifications.all', await getInbox())
    })

    events.on('notifications.allRead', async () => {
      await markAllAsRead()
      events.emit('notifications.all', await getInbox())
    })

    events.on('notifications.trashAll', async () => {
      await archiveAll()
      events.emit('notifications.all', await getInbox())
    })
  }

  /**
   * Create and append a new Notification in the Hub. Emits a `notifications.new` event.
   * @param  {string} options.message     (required) The body message of the notification
   * @param  {string} options.redirectUrl (optional) The URL the users will be redirected to
   *                                      when clicking on the notification
   * @param  {string} options.level       (optional) The level (info, success, error, warning). Defaults to `info`.
   * @param  {bool} options.enableSound (optional) Whether the notification will trigger a buzzing sound
   *                                    if a user is currently logged on the dashboard. (defaults to `false`)
   * @return {Promise}
   */
  const create = async ({ message, redirectUrl, level, enableSound }) => {
    if (!message || typeof message !== 'string') {
      throw new Error("'message' is mandatory and should be a string")
    }

    if (!level || typeof level !== 'string' || !_.includes(['info', 'error', 'success'], level.toLowerCase())) {
      level = 'info'
    } else {
      level = level.toLowerCase()
    }

    const callingFile = getOriginatingModule()
    const callingModuleRoot = callingFile && resolveModuleRootPath(callingFile)

    const module = _.find(modules, mod => {
      return mod.root === callingModuleRoot
    })

    let options = {
      moduleId: 'botpress',
      icon: 'view_module',
      name: 'botpress',
      url: _.isString(redirectUrl) ? redirectUrl : '/'
    }

    if (module) {
      // because the bot itself can send notifications
      options = {
        moduleId: module.name,
        icon: module.settings.menuIcon,
        name: module.settings.menuText,
        url: redirectUrl
      }

      if (!redirectUrl || typeof url !== 'string') {
        options.url = `/modules/${module.name}`
      }
    }

    const notification = {
      id: nanoid(),
      message: message,
      level: level,
      moduleId: options.moduleId,
      icon: options.icon,
      name: options.name,
      url: options.url,
      date: new Date(),
      sound: enableSound || false,
      read: false
    }

    await knex('notifications')
      .insert(toDatabase(knex, notification))
      .then()

    if (logger) {
      const logMessage = `[notification::${notification.moduleId}] ${notification.message}`
      const loggerLevel = logger[level] || logger.info
      loggerLevel(logMessage)
    }

    if (events) {
      events.emit('notifications.new', notification)
    }
  }

  return {
    // ----> Start of legacy API (DEPRECATED as of Botpress 1.1)
    load: getInbox,
    send: ({ message, url, level, sound }) => {
      return create({ message, redirectUrl: url, level, enableSound: sound })
    },
    // End of legacy API <---
    markAsRead,
    markAllAsRead,
    archiveAll,
    archive,
    getInbox,
    getArchived,
    create,
    // internal API
    _bindEvents
  }
}

module.exports = notifications
