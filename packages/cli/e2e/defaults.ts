const noBuild = false
const dryRun = false
const secrets = [] satisfies string[]
const sourceMap = false
const watch = true
const verbose = false
const confirm = true
const json = false
const allowDeprecated = false
const isPublic = false
const visibility = 'private' as const
const minify = true
const profile = undefined
const url = undefined
const bypassBreakingChangeDetection = false

export default {
  minify,
  noBuild,
  dryRun,
  secrets,
  sourceMap,
  watch,
  verbose,
  confirm,
  json,
  allowDeprecated,
  public: isPublic,
  visibility,
  profile,
  url,
  bypassBreakingChangeDetection,
} as const
