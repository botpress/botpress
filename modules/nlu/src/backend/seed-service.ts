import * as sdk from 'botpress/sdk'
import crypto from 'crypto'
import _ from 'lodash'

const MAX_SEED = 10000

const _hashToNumber = (text: string): number => {
  const stringHash = crypto
    .createHash('md5')
    .update(text)
    .digest('hex') // md5 produces 128 bits (16 bytes) hex encoded hash

  // we take half the hash so that it is the size of a number
  const bytesPerNumber = 8 // 64 bits floats === 8 bytes
  const nibblesPerNumber = bytesPerNumber * 2 // 0xff takes 2 nibbles
  const truncated = stringHash.slice(nibblesPerNumber)

  const base = 16
  const rawSeed = parseInt(truncated, base)
  return Math.abs(rawSeed) % MAX_SEED
}

export const getSeed = (bot: sdk.BotConfig): number => {
  if (_.isNumber(bot.nluSeed)) {
    return Math.abs(bot.nluSeed) % MAX_SEED
  }
  return _hashToNumber(bot.id)
}
