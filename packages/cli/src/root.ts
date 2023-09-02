/**
 * Important:
 *
 * This file must be kept at the root of the src directory (and dist directory when built)
 */
import * as utils from './utils'

const SRC_DIR = __dirname as utils.path.AbsolutePath
export const CLI_ROOT_DIR = utils.path.join(SRC_DIR, '..')
