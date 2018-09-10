export type MockObject<T> = { T: T } & { readonly [key in keyof T]: jest.Mock }

export function createSpyObject<T>(): MockObject<T> {
  const obj = {}
  const handler: ProxyHandler<object> = {
    get: function(obj, prop) {
      if (prop === 'T') {
        return proxy
      }

      return prop in obj ? obj[prop] : (obj[prop] = jest.fn())
    }
  }
  const proxy = new Proxy(obj, handler)
  return proxy as MockObject<T>
}
