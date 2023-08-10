/**
 * Important:
 *
 * This file must be kept at the root of the src directory (and dist directory when built)
 */
import Module from 'module'
import pathlib from 'path'

const DEFAULT_DIRNAME = '.botpress'

const getOutDir = () => {
  const { BP_OUTDIR } = process.env
  if (!BP_OUTDIR) {
    return pathlib.join(process.cwd(), DEFAULT_DIRNAME)
  }
  if (pathlib.isAbsolute(BP_OUTDIR)) {
    return BP_OUTDIR
  }
  return pathlib.join(process.cwd(), BP_OUTDIR)
}

const outDirPath = getOutDir()
const outDirName = pathlib.basename(outDirPath)
const originalRequire = Module.prototype.require

const rewire = function (this: NodeRequire, mod: string) {
  const importParts = mod.split('/')

  if (importParts[0] === outDirName) {
    const newMod = importParts.slice(1).join('/')
    const fullpath = pathlib.join(outDirPath, newMod)
    return originalRequire.apply(this, [fullpath])
  }

  return originalRequire.apply(this, [mod])
} as NodeRequire

Module.prototype.require = rewire
