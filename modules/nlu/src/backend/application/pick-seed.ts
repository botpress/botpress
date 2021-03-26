import _ from 'lodash'
import { BotConfig } from './typings'

const MAX_SEED = 10000

const BYTES_PER_NUMBER = 8 // 64 bits floats === 8 bytes
const NIBBLES_PER_NUMBER = BYTES_PER_NUMBER * 2 // 0xff takes 2 nibbles

const BASE = 16

const DEFAULT_SEED = 42

const _hashToNumber = (text: string): number => {
  if (!text.length) {
    return DEFAULT_SEED
  }

  const stringHex = Buffer.from(text).toString('hex')

  // we slice the hex so its the size of a number
  const truncated = stringHex.length > NIBBLES_PER_NUMBER ? stringHex.slice(0, NIBBLES_PER_NUMBER) : stringHex
  return parseInt(truncated, BASE)
}

export default function pickSeed(bot: BotConfig) {
  const rawSeed = _.isNumber(bot.nluSeed) && !_.isNaN(bot.nluSeed) ? bot.nluSeed : _hashToNumber(bot.id)
  return Math.abs(rawSeed) % MAX_SEED
}
