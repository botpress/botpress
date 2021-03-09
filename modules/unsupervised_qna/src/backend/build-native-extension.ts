import getos from 'common/getos'
import fs from 'fs'
import nodePreGyp from 'node-pre-gyp'
import path from 'path'

const MODULE_ROOT = path.join(__dirname, '..', '..')

export default async () => {
  const os = await getos() // TODO: checkout the correct subdirectory

  // copy binary to correct location
  const from = path.join(MODULE_ROOT, 'native_extensions', os.os, 'all', 'tfjs_binding.node')
  const to = nodePreGyp.find(path.join(MODULE_ROOT, 'node_modules', '@tensorflow', 'tfjs-node', 'package.json'))
  fs.copyFileSync(from, to)
}
