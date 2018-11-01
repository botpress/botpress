const chatOptions = {
  hideWidget: true,
  config: {
    botConvoTitle: 'Bot Emulator',
    enableReset: true,
    enableTranscriptDownload: true
  }
}

const params = {
  m: 'channel-web',
  v: 'fullscreen',
  options: JSON.stringify(chatOptions)
}

// Bot will be available at http://$HOST:$PORT/s/$BOT_NAME
bp.http.createShortLink(botId, `http://${process.HOST}:${process.PROXY_PORT}/lite/welcome-bot/`, params)
