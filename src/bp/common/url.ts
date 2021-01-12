export const isBpUrl = (str: string): boolean => {
  const re = /^\/api\/.*\/bots\/.*\/media\/.*/g

  return re.test(str)
}
