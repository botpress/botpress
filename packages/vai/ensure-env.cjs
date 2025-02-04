;(function () {
  if (!process.env.CLOUD_BOT_ID) {
    throw new Error('Env: CLOUD_BOT_ID is required')
  }

  if (!process.env.CLOUD_PAT) {
    throw new Error('Env: CLOUD_PAT is required')
  }
})()
