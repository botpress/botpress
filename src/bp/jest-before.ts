const { Debug: _Debug } = require('./debug.ts')

global.DEBUG = _Debug

if (!process.core_env) {
  process.core_env = process.env
}

process.distro = {
  os: require('os').platform(),
  codename: '',
  dist: '',
  release: ''
}
