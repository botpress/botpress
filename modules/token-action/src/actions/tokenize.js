// const virtual_machine = (bp: SDK, user, session, temp, bot, event, args) => {

const tokenize = async (bp, event, temp) => {
  const modelsDirectory = 'models'
  const modelsPromise = bp.ghost.forGlobal().directoryListing(`./${modelsDirectory}`, '*.model')
  modelsPromise.then(models => {
    if (models.length) {
      const responsePreview = bp.MLToolkit.SentencePiece.encode(event.preview, `global/${modelsDirectory}/${models[0]}`)
      temp['sentencepiece'] = JSON.stringify(responsePreview)
    } else {
      console.log('no models found for tokenization')
    }
  })
}

return tokenize(bp, event, temp)

// }
