const noBuild = false
const dryRun = false
const secrets = [] satisfies string[]
const sourceMap = false
const verbose = false
const confirm = true
const json = false
const allowDeprecated = false
const isPublic = false
const minify = true

export default {
  minify,
  noBuild,
  dryRun,
  secrets,
  sourceMap,
  verbose,
  confirm,
  json,
  allowDeprecated,
  public: isPublic,
}
