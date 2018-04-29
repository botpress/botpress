'use strict'

const npmWhich = require('npm-which')(process.cwd())

module.exports = function findBin(cmd, scripts, options) {
  const npmArgs = (bin, args) =>
    // We always add `--` even if args are not defined. This is required
    // because we pass filenames later.
    ['run', options && options.verbose ? undefined : '--silent', bin, '--']
      // args could be undefined but we filter that out.
      .concat(args)
      .filter(arg => arg !== undefined)

  /*
   * If package.json has script with cmd defined we want it to be executed
   * first. For finding the bin from scripts defined in package.json, there
   * are 2 possibilities. It's a command which does not have any arguments
   * passed to it in the lint-staged config. Or it could be something like
   * `kcd-scripts` which has arguments such as `format`, `lint` passed to it.
   * But we always cannot assume that the cmd, which has a space in it, is of
   * the format `bin argument` because it is legal to define a package.json
   * script with space in it's name. So we do 2 types of lookup. First a naive
   * lookup which just looks for the scripts entry with cmd. Then we split on
   * space, parse the bin and args, and try again.
   *
   * Related:
   *  - https://github.com/kentcdodds/kcd-scripts/pull/3
   *  - https://github.com/okonet/lint-staged/issues/294
   *
   * Example:
   *
   *   "scripts": {
   *     "my cmd": "echo deal-wth-it",
   *     "demo-bin": "node index.js"
   *   },
   *   "lint-staged": {
   *     "*.js": ["my cmd", "demo-bin hello"]
   *   }
   */
  if (scripts[cmd] !== undefined) {
    // Support for scripts from package.json
    return { bin: 'npm', args: npmArgs(cmd) }
  }

  const parts = cmd.split(' ')
  let bin = parts[0]
  const args = parts.splice(1)

  if (scripts[bin] !== undefined) {
    return { bin: 'npm', args: npmArgs(bin, args) }
  }

  /*
    *  If cmd wasn't found in package.json scripts
    *  we'll try to locate the binary in node_modules/.bin
    *  and if this fails in $PATH.
    *
    *  This is useful for shorter configs like:
    *
    *  "lint-staged": {
    *    "*.js": "eslint"
    *  }
    *
    *  without adding
    *
    *  "scripts" {
    *    "eslint": "eslint"
    *  }
    */

  try {
    /* npm-which tries to resolve the bin in local node_modules/.bin */
    /* and if this fails it look in $PATH */
    bin = npmWhich.sync(bin)
  } catch (err) {
    throw new Error(`${bin} could not be found. Try \`npm install ${bin}\`.`)
  }

  return { bin, args }
}
