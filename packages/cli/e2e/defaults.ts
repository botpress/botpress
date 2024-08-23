import * as consts from '../src/consts'

const noBuild = false
const secrets = [] satisfies string[]
const sourceMap = false
const verbose = false
const confirm = true
const json = false
const entryPoint = consts.defaultEntrypoint
const outDir = consts.defaultOutputFolder
const allowDeprecated = false
const isPublic = false
const minify = true
export default {
  minify,
  noBuild,
  secrets,
  sourceMap,
  verbose,
  confirm,
  json,
  entryPoint,
  outDir,
  allowDeprecated,
  public: isPublic,
}
