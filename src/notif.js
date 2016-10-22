import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import uuid from 'node-uuid'

import { resolveModuleRootPath } from './util'

module.exports = (skin, modules) => {

  const notificationsFile = path.join(skin.dataLocation, skin.botfile.notification.file)

  skin.loadNotifications = () => {
    if(fs.existsSync(notificationsFile)) {
      return JSON.parse(fs.readFileSync(notificationsFile))
    }
    return []
  }

  skin.saveNotifications = (notifications) => {
    fs.writeFileSync(notificationsFile, JSON.stringify(notifications))
  }

  skin.events.on('notifications.getAll', () => {
    skin.events.emit('notifications.all', skin.loadNotifications())
  })

  skin.events.on('notifications.read', (id) => {
    let notifications = skin.loadNotifications()
    notifications = notifications.map((notif) => {
      if(notif.id === id) {
        notif.read = true
      }
      return notif
    })
    skin.saveNotifications(notifications)
    skin.events.emit('notifications.all', notifications)
  })

  skin.events.on('notifications.allRead', () => {
    let notifications = skin.loadNotifications()
    notifications = notifications.map((notif) => {
      notif.read = true
      return notif
    })
    skin.saveNotifications(notifications)
    skin.events.emit('notifications.all', notifications)
  })

  skin.events.on('notifications.trashAll', () => {
    skin.saveNotifications([])
    skin.events.emit('notifications.all', [])
  })

  skin.notif = ({ message, url, level }) => {

    if (!message || typeof(message) !== 'string') {
      throw new Error('`message` is mandatory and should be a string')
    }

    if(!level || typeof(level) !== 'string' || !_.includes(['info', 'error', 'success'], level.toLowerCase())) {
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
      moduleId: 'skin',
      icon: 'icon-puzzle',
      name: 'skin',
      url: '/'
    }

    if(module) {
      // because the bot itself can send notifications
      options = {
        modileId: module.name,
        icon: module.settings.menuIcon,
        name: module.settings.menuText
      }

      if(!url || typeof(url) !== 'string') {
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

    let notifications = skin.loadNotifications()
    if(notifications.length >= skin.botfile.notification.maxLength) {
      notifications.pop()
    }

    notifications.unshift(notification)
    skin.saveNotifications(notifications)

    skin.events.emit('notifications.new', notification)
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
