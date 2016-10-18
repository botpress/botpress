const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const uuid = require('node-uuid')

const { resolveModuleRootPath } = require('./util')

module.exports = (skin, modules) => {

  const notificationsFile = path.join(skin.dataLocation, 'notifications.json')

  // TODO Make this function overridable
  function loadNotifications() {
    if(fs.existsSync(notificationsFile)) {
      return JSON.parse(fs.readFileSync(notificationsFile))
    }

    return []
  }

  // TODO Make this function overridable
  function saveNotifications(notifications) {
    fs.writeFileSync(notificationsFile, JSON.stringify(notifications))
  }

  skin.events.on('notifications.getAll', () => {
    skin.events.emit('notifications.all', loadNotifications())
  })

  skin.events.on('notifications.read', (id) => {
    let notifications = loadNotifications()
    notifications = notifications.map((notif) => {
      if(notif.id === id) {
        notif.read = true
      }
      return notif
    })
    saveNotifications(notifications)
    skin.events.emit('notifications.all', notifications)
  })

  skin.events.on('notifications.allRead', () => {
    let notifications = loadNotifications()
    notifications = notifications.map((notif) => {
      notif.read = true
      return notif
    })
    saveNotifications(notifications)
    skin.events.emit('notifications.all', notifications)
  })

  skin.events.on('notifications.trashAll', () => {
    saveNotifications([])
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

    if(!url || typeof(url) !== 'string') {
      url = `/modules/${module.name}`
    }

    const notification = {
      message,
      level,
      url,
      id: uuid.v4(),
      moduleId: module.name,
      icon: module.settings.menuIcon || 'icon-puzzle',
      name: module.settings.menuText || module.name,
      date: new Date(),
      read: false
    }

    let notifications = loadNotifications()
    const maxNotifications = 30 // TODO Check settings
    if(notifications.length >= maxNotifications) {
      notifications.pop()
    }

    notifications.unshift(notification)
    saveNotifications(notifications)

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
