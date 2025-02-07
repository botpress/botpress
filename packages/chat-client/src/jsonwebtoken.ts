import { isBrowser } from 'browser-or-node'
import type * as jwt from 'jsonwebtoken'

const requireJwt = (): typeof jwt => require('jsonwebtoken')
const packageModule = isBrowser ? null : requireJwt()
export default packageModule
