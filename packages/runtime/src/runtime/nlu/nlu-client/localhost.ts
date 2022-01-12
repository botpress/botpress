import url from 'url'

export const isLocalHost = (endpoint: string) => {
  const { hostname } = new url.URL(endpoint)
  return ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname)
}
