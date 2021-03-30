const v2Mapping = {
  '/content': '/cms',
  '/flow/': '/flows/flow/'
}

export const fixStudioMappingMw = (req, res, next) => {
  const match = Object.keys(v2Mapping).find(x => req.url.startsWith(x))

  if (match) {
    req.url = req.url.replace(match, v2Mapping[match])
  }

  next()
}
