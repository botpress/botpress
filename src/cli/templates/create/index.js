module.exports = (skin) => {

  setInterval(() => {
    skin.notif({
      message: 'Hello, notification'
    })
  }, 8000)

  skin.events.on('hello.notification', () => {
    skin.notif({
      message: 'Hello, notification',
      level: 'error'
    })
  })
}
