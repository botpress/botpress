const chatOptions = {
  hideWidget: true,
  config: {
    enableReset: true,
    enableTranscriptDownload: true
  }
}

const params = {
  m: 'channel-web',
  v: 'Fullscreen',
  options: JSON.stringify(chatOptions)
}

// Bot will be available at $EXTERNAL_URL/s/$BOT_NAME
bp.http.createShortLink(botId, `${process.EXTERNAL_URL}/lite/${botId}/`, params)
