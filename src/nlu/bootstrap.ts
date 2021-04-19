import DEBUG from './utils/simple-logger/debug'

process.core_env = process.env as BotpressEnvironmentVariables
global['NativePromise'] = global.Promise
global.DEBUG = DEBUG
