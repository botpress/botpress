

interface MediaUrlElements {
  botId?: string
  mediaId?: string
  isBotpressUrl: boolean
}

export const parseBotpressMediaUrl = (url: string): MediaUrlElements => {
  const bpUrlRegex = /^\/api\/.*\/bots\/(.*)\/media\/(.*)/g
  const parts = bpUrlRegex.exec(url)

  if (parts) {
    return { botId: parts[1], mediaId: parts[2], isBotpressUrl: true }
  }

  return { isBotpressUrl: false }
}

export const formatUrl = (baseUrl: string, url: string, mediaUrl?: string): string => {
  const item = parseBotpressMediaUrl(url)

  if (!item.isBotpressUrl) {
    return url
  }

  return mediaUrl ? `${mediaUrl}/${item.botId}/${item.mediaId}` : `${baseUrl}${url}`
}
