import crypto from 'crypto'
import { machineId } from 'node-machine-id'
import os from 'os'

export const gaId = 'UA-90044826-3'

export const machineUUID = async () => {
  return machineId().catch(() => {
    const hash = crypto.createHash('sha256')
    hash.update(os.arch() + os.hostname() + os.platform() + os.type())
    return hash.digest('hex')
  })
}
