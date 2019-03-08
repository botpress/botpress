import 'bluebird-global'
import getos from 'getos'
import os from 'os'

class Distro implements OSDistribution {
  os!: NodeJS.Platform
  dist!: string
  codename!: string
  release!: string

  constructor(distro: OSDistribution) {
    Object.assign(this, distro)
  }

  sanitize(str = ''): string {
    str = str.toLowerCase().replace(/ /gi, '-')
    str = str.replace(/[^A-Z0-9\._-]/gi, '') // remove all chars that are not A-Z, 0-9 - _ and .
    return str.replace(/\./gi, '_') // replace dots with _ for versions
  }

  toString(): string {
    const sDist = this.sanitize(this.dist).replace('-linux', '')
    const sRelease = this.sanitize(this.release)
    return this.dist ? (this.release ? `${this.os} ${sDist}_${sRelease}` : `${this.os} ${sDist}`) : this.os
  }

  get [Symbol.toStringTag]() {
    return 'OS'
  }
}

export default async function(): Promise<typeof process.distro> {
  const obj = (await Promise.fromCallback(cb => getos(cb)).catch(_err => ({
    os: os.platform(),
    dist: 'default',
    codename: 'N/A',
    release: 'N/A'
  }))) as typeof process.distro

  return new Distro(obj)
}
