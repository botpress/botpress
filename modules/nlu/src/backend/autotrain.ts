import * as sdk from 'botpress/sdk'

const KVS_KEY = 'nlu-autoTrain'

export const set = async (bp: typeof sdk, botId: string, autoTrain: boolean) => {
  const kvs = bp.kvs.forBot(botId)
  if (autoTrain) {
    await kvs.delete(KVS_KEY)
  } else {
    await kvs.set(KVS_KEY, 'pause')
  }
}

export const isOn = async (bp: typeof sdk, botId: string) => {
  return !(await bp.kvs.forBot(botId).exists(KVS_KEY))
}
