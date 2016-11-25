import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import uuid from 'uuid'

import { resolveModuleRootPath } from './util'

module.exports = (bp, modules) => {

  const notificationsFile = path.join(bp.dataLocation, bp.botfile.notification.file)

  bp.loadNotifications = () => {
    if (fs.existsSync(notificationsFile)) {
      return JSON.parse(fs.readFileSync(notificationsFile))
    }
    return []
  }

  bp.saveNotifications = (notifications) => {
    fs.writeFileSync(notificationsFile, JSON.stringify(notifications))
  }

  bp.events.on('notifications.getAll', () => {
    bp.events.emit('notifications.all', bp.loadNotifications())
  })

  bp.events.on('notifications.read', (id) => {
    let notifications = bp.loadNotifications()
    notifications = notifications.map((notif) => {
      if (notif.id === id) {
        notif.read = true
      }
      return notif
    })
    bp.saveNotifications(notifications)
    bp.events.emit('notifications.all', notifications)
  })

  bp.events.on('notifications.allRead', () => {
    let notifications = bp.loadNotifications()
    notifications = notifications.map((notif) => {
      notif.read = true
      return notif
    })
    bp.saveNotifications(notifications)
    bp.events.emit('notifications.all', notifications)
  })

  bp.events.on('notifications.trashAll', () => {
    bp.saveNotifications([])
    bp.events.emit('notifications.all', [])
  })

  bp.notif = ({ message, url, level }) => {

    if (!message || typeof(message) !== 'string') {
      throw new Error('`message` is mandatory and should be a string')
    }

    if (!level || typeof(level) !== 'string' || !_.includes(['info', 'error', 'success'], level.toLowerCase())) {
      level = 'info'
    } else {
      level = level.toLowerCase()
    }


    const callingFile = getOriginatingModule()
    const callingModuleRoot = resolveModuleRootPath(callingFile)

    const module = _.find(modules, (mod) => {
      return mod.root === callingModuleRoot
    })

    let options = {
      // TODO should probably go in settings as defaults
      moduleId: 'botpress',
      icon: 'view_module',
      name: 'botpress',
      url: '/'
    }

    if (module) {
      // because the bot itself can send notifications
      options = {
        moduleId: module.name,
        icon: module.settings.menuIcon,
        name: module.settings.menuText,
        url: url
      }

      if (!url || typeof(url) !== 'string') {
        options.url = `/modules/${module.name}`
      }
    }

    const notification = {
      id: uuid.v4(),
      message: message,
      level: level,
      moduleId: options.moduleId,
      icon: options.icon,
      name: options.name,
      url: options.url,
      date: new Date(),
      read: false
    }

    let notifications = bp.loadNotifications()
    if (notifications.length >= bp.botfile.notification.maxLength) {
      notifications.pop()
    }

    notifications.unshift(notification)
    bp.saveNotifications(notifications)

    bp.events.emit('notifications.new', notification)

    const logMessage = '[notification::' + notification.moduleId + '] ' + notification.message
    if (bp.logger) {
      (bp.logger[level] || bp.logger.info)(logMessage)
    }
  }
}

function getOriginatingModule() {
  // TODO Explain hack
  var origPrepareStackTrace = Error.prepareStackTrace
  Error.prepareStackTrace = function (_, stack) {
    return stack
  }
  var err = new Error()
  var stack = err.stack
  Error.prepareStackTrace = origPrepareStackTrace
  stack.shift()

  return stack[1].getFileName()
}
