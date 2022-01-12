export const isBpUrl = (str: string): boolean => {
  const re = /^\/api\/.*\/bots\/.*\/media\/.*/g

  return re.test(str)
}

export const formatUrl = (baseUrl: string, url: string): string => {
  const bpUrlRegex = /^\/api\/.*\/bots\/(.*)\/media\/(.*)/g
  const parts = bpUrlRegex.exec(url)

  if(!parts){
    return url
  }

  if(!process.env.MEDIA_URL){
    return `${baseUrl}${url}`
  }

  return `${process.env.MEDIA_URL}/${parts[1]}/${parts[2]}`
}
