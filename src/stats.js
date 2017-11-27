import os from 'os'
import crypto from 'crypto'
import ua from 'universal-analytics'
import { machineId } from 'node-machine-id'

module.exports = botfile => {
  let visitor = null
  let queued = []

  machineId()
    .catch(() => {
      const hash = crypto.createHash('sha256')
      hash.update(os.arch() + os.hostname() + os.platform() + os.type())
      return hash.digest('hex')
    })
    .then(mid => {
      visitor = ua('UA-90044826-1', mid, { strictCidFormat: false })
      queued.forEach(a => a())
      queued = []
    })

  const track = (category, action, label = null, value = null) => {
    if (!!botfile.optOutStats) {
      return // Don't track if bot explicitly opted out from stats collection
    }

    if (!visitor) {
      queued.push(() => track(category, action, label, value))
      return
    }

    visitor.event(category, action, label, value, () => {
      /* ignore errors */
    })
  }

  const trackException = message => {
    if (!!botfile.optOutStats) {
      return // Don't track if bot explicitly opted out from stats collection
    }

    if (!visitor) {
      queued.push(() => trackException(message))
      return
    }

    visitor.event(message, () => {
      /* ignore errors */
    })
  }

  return { track, trackException }
}
