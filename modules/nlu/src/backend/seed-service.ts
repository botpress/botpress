import * as sdk from 'botpress/sdk'
import crypto from 'crypto'
import _ from 'lodash'

const MAX_SEED = 10000

const BYTES_PER_NUMBER = 8 // 64 bits floats === 8 bytes
const NIBBLES_PER_NUMBER = BYTES_PER_NUMBER * 2 // 0xff takes 2 nibbles

const BASE = 16

const _hashToNumber = (text: string): number => {
  const stringHash = crypto
    .createHash('md5')
    .update(text)
    .digest('hex') // md5 produces 128 bits (16 bytes) hex encoded hash

  // we take half the hash so that it is the size of a number
  const truncated = stringHash.slice(NIBBLES_PER_NUMBER)
  return parseInt(truncated, BASE)
}

export const getSeed = (bot: sdk.BotConfig): number => {
  const rawSeed = _.isNumber(bot.nluSeed) ? bot.nluSeed : _hashToNumber(bot.id)
  return Math.abs(rawSeed) % MAX_SEED
}
