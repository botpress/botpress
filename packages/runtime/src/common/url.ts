export const isBpUrl = (str: string): boolean => {
  const re = /^\/api\/.*\/bots\/.*\/media\/.*/g

  return re.test(str)
}

// Duplicate of modules/builtin/src/content-types/_utils.js
export const formatUrl = (baseUrl: string, url: string): string => {
  if (isBpUrl(url)) {
    return `${baseUrl}${url}`
  } else {
    return url
  }
}
