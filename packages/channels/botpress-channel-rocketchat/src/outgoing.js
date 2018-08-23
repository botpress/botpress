const handlePromise = (event, next, promise) => {
  return promise
    .then(res => {
      console.log('WE ARE GOING NEXT PROMISE')
      next()
      event._resolve && event._resolve()
      return res
    })
    .catch(err => {
      console.log('THERE WAS AN ERROR')
      next(err)
      event._reject && event._reject(err)
      throw err
    })
}

const handleText = (event, next, rocketchat) => {
  if (event.platform !== 'rocketchat' || event.type !== 'text') {
    return next()
  }
  //console.log("HANDLE TEXT")
  const text = event.text
  const options = {}

  return handlePromise(event, next, rocketchat.sendText(text, options, event))
}

module.exports = {
  text: handleText
}
