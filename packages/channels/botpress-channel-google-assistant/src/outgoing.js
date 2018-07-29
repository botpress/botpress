const handlePromise = (next, promise) => {
  return promise
    .then(res => {
      next()
      return res
    })
    .catch(err => {
      next(err)
      throw err
    })
}

const handleMessage = (event, next, googleAssistant) =>
  handlePromise(next, googleAssistant.sendText(event.raw.to, event.text, event.raw))

module.exports = {
  message: handleMessage
}
