import _ from 'lodash'
import ms from 'ms'

export class UntrustedSandbox {
  static cache: any
  static cacheExpiry: number

  static getSandboxProcessArgs() {
    if (Date.now() > this.cacheExpiry) {
      this.cache = undefined
    }

    if (this.cache) {
      return this.cache
    }

    this.cacheExpiry = Date.now() + ms('2m')
    this.cache = {
      ..._.pick(process, 'HOST', 'PORT', 'EXTERNAL_URL', 'PROXY', 'ROOT_PATH'),
      env: {
        ..._.pickBy(process.env, (_value, name) => name.startsWith('EXPOSED_')),
        ..._.pick(process.env, 'TZ', 'LANG', 'LC_ALL', 'LC_CTYPE', 'HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY')
      }
    }

    return this.cache
  }
}
