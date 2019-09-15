const extractCookie = name =>
  ('; ' + document.cookie)
    .split(`; ${name}=`)
    .pop()
    .split(';')
    .shift()

export { extractCookie }
