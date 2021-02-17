import _ from 'lodash'
import { TrainingSession } from '../../typings'

export const expectTs = (ts: Partial<TrainingSession>) => expect.objectContaining<Partial<TrainingSession>>(ts)

// TODO: this function is a mess, maybe I should unit test it...
export const expectTrainingsOccurInOrder = (trainSessions: TrainingSession[], expectedOrder: number[]) => {
  const progressUpdates = trainSessions.filter(ts => ['training', 'done'].includes(ts.status))

  const key = (ts: TrainingSession) => `${ts.botId}:${ts.language}`
  const allKeys = _(trainSessions)
    .map(ts => key(ts))
    .uniq()
    .value()

  const intervals = allKeys.map(k => {
    const start = _.findIndex(progressUpdates, ts => key(ts) === k)
    const end = _.findLastIndex(progressUpdates, ts => key(ts) === k)
    return { start, end }
  })

  const zeros = (len: number) => Array(len).fill(0)
  const buckets: number[] = zeros(intervals.length)

  for (let i = 0; i < intervals.length; i++) {
    if (i === 0) {
      buckets[i] = 0
      continue
    }
    const previousBucket = buckets[i - 1]
    if (intervals[i].start < intervals[i - 1].end) {
      buckets[i] = previousBucket
      continue
    }
    buckets[i] = previousBucket + 1
  }

  const actualOrder = _.uniq(buckets).map(i => buckets.filter(b => b === i).length)
  expect([...actualOrder]).toStrictEqual([...expectedOrder])
}

export const expectTrainingToStartAndComplete = (socket: jest.Mock, trainId: { botId: string; language: string }) => {
  const { botId, language } = trainId
  expect(socket).toHaveBeenCalledWith(expectTs({ botId, status: 'training-pending', language }))
  expect(socket).toHaveBeenCalledWith(expectTs({ botId, status: 'training', language }))
  expect(socket).toHaveBeenCalledWith(expectTs({ botId, status: 'done', language }))
}

export const expectEngineToHaveTrained = (trainMock: jest.SpyInstance, languageCode: string) => {
  expect(trainMock).toHaveBeenCalledWith(
    expect.stringContaining(languageCode),
    expect.objectContaining({ languageCode }),
    expect.anything()
  )
}

export const expectEngineToHaveLoaded = (loadMock: jest.SpyInstance, languageCode: string) => {
  expect(loadMock).toHaveBeenCalledWith(expect.objectContaining({ languageCode }))
}
