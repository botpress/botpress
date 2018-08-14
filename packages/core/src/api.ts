import { ExtendedKnex } from './database/interfaces'
import { Logger } from './misc/interfaces'
import { CMSService } from './services/cms/cms-service'

export type BotpressAPI = {
  // http: {} // getRouter(), createShortLink()
  cms: CMSService
  // io: {} // sendIncoming, sendOutgoing
  database: ExtendedKnex
  // dialog: {}
  // middleware: {} // register
  logger: Logger
}
