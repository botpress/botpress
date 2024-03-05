import { Client } from '../../src'
import * as consts from '../consts'
import * as utils from '../utils'

const toString = (x: any) => {
  if (typeof x === 'string') {
    return x
  }
  if (typeof x === 'number') {
    return x.toString()
  }
  if (x instanceof Error) {
    return x.message
  }
  return JSON.stringify(x)
}

const debug = (...args: any[]) => {
  const strs = args.map(toString) // for puppeteer to be able to print it
  const str = strs.join(' ')
  console.log(str)
}

const exit = (code: 0 | 1) => {
  if (code === 0) {
    console.log(consts.successMessage)
  } else {
    console.log(consts.failureMessage)
  }
}

const main = async () => {
  const client = new Client()
  const { account } = await client.getAccount()
  utils.expect(account).toBeTruthy()
}

try {
  main()
  debug('done')
  exit(0)
} catch (err) {
  exit(1)
}
