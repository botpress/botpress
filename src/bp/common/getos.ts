import 'bluebird-global'
import os from 'os'

export class Distro implements OSDistribution {
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
  if (process.core_env.BP_IS_DOCKER) {
    return new Distro({
      os: 'linux',
      codename: 'beaver',
      release: '18.04',
      dist: 'ubuntu'
    })
  }

  const getos = require('getos')
  const obj = (await Promise.fromCallback(getos)
    .timeout(1000)
    .catch(_err => ({
      os: os.platform(),
      dist: 'default',
      codename: 'N/A',
      release: 'N/A'
    }))) as typeof process.distro

  return new Distro(obj)
}
