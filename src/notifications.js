import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import uuid from 'uuid'

import { resolveModuleRootPath } from './util'

// TODO this can be an util
const createJsonStore = (filePath, initData) => ({
  load: () => {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath))
    }

    return initData
  },

  save: data => {
    fs.writeFileSync(filePath, JSON.stringify(data))
  }
})

const bindEvents = (loadNotifs, saveNotifs, events) => {
  events.on('notifications.getAll', () => {
    events.emit('notifications.all', loadNotifs())
  })

  const markReadIf = cond => {
    const notifications = loadNotifs()
    .map(notif => {
      if (cond(notif)) {
        notif.read = true
      }
      return notif
    })

    saveNotifs(notifications)
    events.emit('notifications.all', notifications)
  }

  events.on('notifications.read', (id) => {
    markReadIf(notif => notif.id === id)
  })

  events.on('notifications.allRead', () => {
    markReadIf(() => true)
  })

  events.on('notifications.trashAll', () => {
    saveNotifs([])
    events.emit('notifications.all', [])
  })
}

export default (dataLocation, notifConfig, modules, events, logger) => {
  const notificationsFile = path.join(dataLocation, notifConfig.file)

  const {
    load: loadNotifs,
    save: saveNotifs,
  } = createJsonStore(notificationsFile, [])

  bindEvents(loadNotifs, saveNotifs, events)

  const sendNotif = ({ message, url, level, sound }) => {

    if (!message || typeof(message) !== 'string') {
      throw new Error('\'message\' is mandatory and should be a string')
    }

    if (
      !level || typeof(level) !== 'string' ||
      !_.includes(['info', 'error', 'success'], level.toLowerCase())
    ) {
      level = 'info'
    } else {
      level = level.toLowerCase()
    }

    const callingFile = getOriginatingModule()
    const callingModuleRoot = callingFile && resolveModuleRootPath(callingFile)

    const module = _.find(modules, (mod) => {
      return mod.root === callingModuleRoot
    })

    let options = {
      // TODO should probably go in settings as defaults
      moduleId: 'botpress',
      icon: 'view_module',
      name: 'botpress',
      url: url || '/'
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
      sound: sound || false,
      read: false
    }

    let notifications = loadNotifs()
    if (notifications.length >= notifConfig.maxLength) {
      notifications.pop()
    }

    notifications.unshift(notification)
    saveNotifs(notifications)

    events.emit('notifications.new', notification)

    const logMessage = `[notification::${notification.moduleId}] ${notification.message}`
    if (logger) {
      (logger[level] || logger.info)(logMessage)
    }
  }

  return {
    load: loadNotifs,
    save: saveNotifs,
    send: sendNotif,
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
