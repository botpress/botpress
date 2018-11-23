import crypto from 'crypto'
import { machineId } from 'node-machine-id'
import os from 'os'

export const gaId = 'UA-90044826-3'

export const machineUUID = async () => {
  return machineId().catch(() => {
    // In case MachineId fails
    const hash = crypto.createHash('sha256')
    const network = os.networkInterfaces()
    hash.update(os.arch() + os.hostname() + os.platform() + os.type() + network['mac'])
    return hash.digest('hex')
  })
}
