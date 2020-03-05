import * as sdk from 'botpress/sdk'

const KVS_KEY = 'nlu-autotrain'

export const set = async (bp: typeof sdk, botId: string, autotrain: boolean) => {
  const kvs = bp.kvs.forBot(botId)
  if (autotrain) {
    await kvs.delete(KVS_KEY)
  } else {
    await kvs.set(KVS_KEY, 'pause')
  }
}

export const isOn = async (bp: typeof sdk, botId: string) => {
  return !(await bp.kvs.forBot(botId).exists(KVS_KEY))
}
