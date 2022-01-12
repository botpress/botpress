export const isBpUrl = (str: string): boolean => {
  const re = /^\/api\/.*\/bots\/.*\/media\/.*/g

  return re.test(str)
}

interface MediaUrlElements {
  botId?: string
  mediaId?: string
  isBotpressUrl: boolean
}

const parseBotpressMediaUrl = (url: string): MediaUrlElements => {
  const bpUrlRegex = /^\/api\/.*\/bots\/(.*)\/media\/(.*)/g
  const parts = bpUrlRegex.exec(url)

  if (parts) {
    return { botId: parts[1], mediaId: parts[2], isBotpressUrl: true }
  }

  return { isBotpressUrl: false }
}

export const formatUrl = (baseUrl: string, url: string): string => {
  const item = parseBotpressMediaUrl(url)

  if (!item.isBotpressUrl) {
    return url
  }

  return process.env.MEDIA_URL ? `${process.env.MEDIA_URL}/${item.botId}/${item.mediaId}` : `${baseUrl}${url}`
}
