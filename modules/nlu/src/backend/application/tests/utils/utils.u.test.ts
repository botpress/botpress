import { NLU } from 'botpress/sdk'

import './sdk.u.test'

export const areEqual = (id1: NLU.ModelId, id2: NLU.ModelId): boolean => {
  return (
    id1.contentHash === id2.contentHash &&
    id1.specificationHash === id2.specificationHash &&
    id1.languageCode === id2.languageCode &&
    id1.seed === id2.seed
  )
}

export const sleep = async (ms: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}
