global['NativePromise'] = global.Promise

import 'reflect-metadata'
import metadata from '../metadata.json'
import { loadEnvVars, setupErrorHandlers, setupProcessVars } from './misc'

setupErrorHandlers()
setupProcessVars()
loadEnvVars()

try {
  process.BOTPRESS_VERSION = metadata.version

  require('./cli')
} catch (err) {
  global.printErrorDefault(err)
}
