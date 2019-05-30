// const virtual_machine = (bp: SDK, user, session, temp, bot, event, args) => {
const tokenize = async (bp, event, temp) => {
  const modelsPromise = bp.ghost.forGlobal().directoryListing(`./models`, '*.model')
  modelsPromise.then(models => {
    if (models.length) {
      const proc = bp.MLToolkit.SentencePiece.createProcessor()
      proc.loadModel(`/home/francois/Documents/botpress-root/botpress/out/bp/data/global/models/${models[0]}`)
      const responsePreview = proc.encode(event.preview)

      temp['sentencepiece'] = `encode: ${JSON.stringify(responsePreview)}, \ndecode: ${proc.decode(responsePreview)}`
    } else {
      console.log('no models found for tokenization')
    }
  })
}

return tokenize(bp, event, temp) // }
